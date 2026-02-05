import asyncio
import logging
from dotenv import load_dotenv

from livekit import agents, rtc
from livekit.agents import AgentServer, AgentSession, Agent, room_io, get_job_context
from livekit.agents.llm import ImageContent, ChatContext, ChatMessage
from livekit.plugins import noise_cancellation, silero, google, deepgram, cartesia
from livekit.plugins.turn_detector.multilingual import MultilingualModel
from prompts import SYSTEM_PROMPT

load_dotenv(".env.local")

logger = logging.getLogger("vision-agent")
logger.setLevel(logging.DEBUG)


class VoiceAssistantAgent(Agent):
    def __init__(self) -> None:
        self._latest_frame = None
        self._video_stream = None
        self._tasks = []
        super().__init__(
            instructions=SYSTEM_PROMPT
        )

    async def on_enter(self):
        logger.info("Agent on_enter called - setting up video track subscription")
        room = get_job_context().room

        # Find the first video track (if any) from remote participants
        for participant in room.remote_participants.values():
            logger.info(f"Found participant: {participant.identity}")
            video_tracks = [
                publication.track
                for publication in participant.track_publications.values()
                if publication.track and publication.track.kind == rtc.TrackKind.KIND_VIDEO
            ]
            logger.info(f"Found {len(video_tracks)} video tracks")
            if video_tracks:
                self._create_video_stream(video_tracks[0])
                break

        # Watch for new video tracks not yet published
        @room.on("track_subscribed")
        def on_track_subscribed(
            track: rtc.Track,
            publication: rtc.RemoteTrackPublication,
            participant: rtc.RemoteParticipant,
        ):
            logger.info(f"track_subscribed: {track.kind} from {participant.identity}")
            if track.kind == rtc.TrackKind.KIND_VIDEO:
                logger.info("Creating video stream for VIDEO track")
                self._create_video_stream(track)

    async def on_user_turn_completed(
        self, turn_ctx: ChatContext, new_message: ChatMessage
    ) -> None:
        """Add the latest video frame to the user's message before LLM processing."""
        if self._latest_frame:
            try:
                # Pass VideoFrame directly to ImageContent
                img_content = ImageContent(image=self._latest_frame)
                new_message.content.append(img_content)
                logger.info("Frame added to message")
            except Exception as e:
                logger.error(f"Error adding frame: {e}")
            finally:
                self._latest_frame = None

    # Helper method to buffer the latest video frame from the user's track
    def _create_video_stream(self, track: rtc.Track):
        logger.info(f"_create_video_stream called for track: {track.sid}")
        # Close any existing stream (we only want one at a time)
        if self._video_stream is not None:
            asyncio.create_task(self._video_stream.aclose())

        # Create a new stream to receive frames
        self._video_stream = rtc.VideoStream(track)

        async def read_stream():
            frame_count = 0
            logger.info("Starting to read video stream...")
            async for event in self._video_stream:
                # Store the latest frame for use later
                self._latest_frame = event.frame
                frame_count += 1
                if frame_count % 30 == 0:  # Log every 30 frames
                    logger.info(f"Received {frame_count} frames, latest frame stored")

        # Store the async task
        task = asyncio.create_task(read_stream())
        task.add_done_callback(lambda t: self._tasks.remove(t) if t in self._tasks else None)
        self._tasks.append(task)


server = AgentServer()


@server.rtc_session()
async def voice_agent(ctx: agents.JobContext):
    # Use explicit Google LLM plugin for better multimodal support
    llm_instance = google.LLM(model="gemini-3-flash-preview")
    logger.info(f"Created Google LLM instance: {llm_instance}")
    
    session = AgentSession(
        stt=deepgram.STTv2(
            model="flux-general-en",
            eager_eot_threshold=0.4,
        ),
        llm=llm_instance,
        tts=cartesia.TTS(
            model="sonic-3",
            voice="f786b574-daa5-4673-aa0c-cbe3e8534c02",
        ),  
        vad=silero.VAD.load(),
        turn_detection=MultilingualModel(),
    )

    await session.start(
        room=ctx.room,
        agent=VoiceAssistantAgent(),
        room_options=room_io.RoomOptions(
            audio_input=room_io.AudioInputOptions(
                noise_cancellation=lambda params: noise_cancellation.BVCTelephony()
                if params.participant.kind == rtc.ParticipantKind.PARTICIPANT_KIND_SIP
                else noise_cancellation.BVC(),
            ),
        ),
    )

    await session.generate_reply(
        instructions="Greet the user warmly and offer your assistance.",
    )


if __name__ == "__main__":
    agents.cli.run_app(server)


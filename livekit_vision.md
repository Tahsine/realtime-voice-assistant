LiveKit docs › Multimodality › Vision

---

# Vision

> Enhance your agent with visual understanding from images and live video.

## Overview

LiveKit Agents has tools for adding raw images from disk, the network, or uploaded directly from your frontend into your agent's chat context to utilize the vision features of your LLM. Additionally, you can use live video either with sampled frames in an STT-LLM-TTS pipeline model or true video input with a realtime model such as [Gemini Live](https://docs.livekit.io/agents/models/realtime/plugins/gemini.md).

This guide includes an overview of the vision features and code samples for each use case.

## Images

The agent's chat context supports images as well as text. You can add as many images as you want to the chat context, but keep in mind that larger context windows contribute to slow response times.

To add an image to the chat context, create an `ImageContent` object and include it in a chat message. The image content can be a base 64 data URL, an external URL, or a frame from a [video track](https://docs.livekit.io/transport/media.md).

### Load into initial context

The following example shows an agent initialized with an image at startup. This example uses an external URL, but you can modify it to load a local file using a base 64 data URL instead:

** Filename: `agent.py`**

```python
def entrypoint(ctx: JobContext):
    # ctx.connect, etc.

    session = AgentSession(
        # ... stt, tts, llm, etc.
    )
    
    initial_ctx = ChatContext()
    initial_ctx.add_message(
        role="user",
        content=[
            "Here is a picture of me", 
            ImageContent(image="https://example.com/image.jpg")
        ],
    )

    await session.start(
        room=ctx.room,
        agent=Agent(chat_ctx=initial_ctx,),
        # ... room_options, etc.
    )        

```

** Filename: `Required imports`**

```python
from livekit.agents.llm import ImageContent
from livekit.agents import Agent, AgentSession, ChatContext, JobContext

```

** Filename: `agent.ts`**

```typescript
export default defineAgent({
  entry: async (ctx: JobContext) => {
    // await ctx.connect(), etc

    const initialCtx = llm.ChatContext.empty();

    initialCtx.addMessage({
      role: 'user',
      content: [
        'Here is a picture of me',
        llm.createImageContent({
          image: 'https://example.com/image.jpg',
        }),
      ],
    });

    const agent = new voice.Agent({
      instructions: 'You are a helpful voice AI assistant.',
      chatCtx: initialCtx,
    });

    const session = new voice.AgentSession({
      // ... stt, tts, llm, etc.
    });

    await session.start({
      room: ctx.room,
      agent,
      // ... inputOptions, etc.
    });
  },
});

```

** Filename: `Required imports`**

```typescript
import { type JobContext, defineAgent, llm, voice } from '@livekit/agents';

```

> 🔥 **LLM provider support for external URLs**
> 
> Not every provider supports external image URLs. Consult their documentation for details.

### Upload from frontend

To upload an image from your frontend app, use the [sendFile method](https://docs.livekit.io/transport/data/byte-streams.md#sending-files) of the LiveKit SDK. Add a byte stream handler to your agent to receive the image data and add it to the chat context. Here is a simple agent capable of receiving images from the user on the byte stream topic `"images"`:

** Filename: `agent.py`**

```python
class Assistant(Agent):
    def __init__(self) -> None:
        self._tasks = [] # Prevent garbage collection of running tasks
        super().__init__(instructions="You are a helpful voice AI assistant.")
    
    async def on_enter(self):
        def _image_received_handler(reader, participant_identity):
            task = asyncio.create_task(
                self._image_received(reader, participant_identity)
            )
            self._tasks.append(task)
            task.add_done_callback(lambda t: self._tasks.remove(t))
        
        # Add the handler when the agent joins
        get_job_context().room.register_byte_stream_handler("images", _image_received_handler)
    
    async def _image_received(self, reader, participant_identity):
        image_bytes = bytes()
        async for chunk in reader:
            image_bytes += chunk

        chat_ctx = self.chat_ctx.copy()

        # Encode the image to base64 and add it to the chat context
        chat_ctx.add_message(
            role="user",
            content=[
                ImageContent(
                    image=f"data:image/png;base64,{base64.b64encode(image_bytes).decode('utf-8')}"
                )
            ],
        )
        await self.update_chat_ctx(chat_ctx)

```

** Filename: `Required imports`**

```python
import asyncio
import base64
from livekit.agents import Agent, get_job_context
from livekit.agents.llm import ImageContent

```

** Filename: `agent.ts`**

```typescript
class Assistant extends voice.Agent {
  private tasks: Set<Task<void>> = new Set(); // Prevent garbage collection of running tasks

  constructor() {
    super({
      instructions: 'You are a helpful voice AI assistant.',
    });
  }

  async onEnter(): Promise<void> {
    // Register byte stream handler for receiving images
    getJobContext().room.registerByteStreamHandler('images', async (stream: ByteStreamReader) => {
      const task = Task.from((controller) => this.imageReceived(stream, controller));
      this.tasks.add(task);

      task.result.finally(() => {
        this.tasks.delete(task);
      });
    });
  }

  private async imageReceived(
    stream: ByteStreamReader,
    controller: AbortController,
  ): Promise<void> {
    const chunks: Uint8Array[] = [];

    // Read all chunks from the stream
    for await (const chunk of stream) {
      if (controller.signal.aborted) return;
      chunks.push(chunk);
    }

    // Combine all chunks into a single buffer
    const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const imageBytes = new Uint8Array(totalLength);
    let offset = 0;

    for (const chunk of chunks) {
      imageBytes.set(chunk, offset);
      offset += chunk.length;
    }

    const chatCtx = this.chatCtx.copy();

    // Encode the image to base64 and add it to the chat context
    const imageContent = llm.createImageContent({
      image: `data:image/png;base64,${Buffer.from(imageBytes).toString('base64')}`,
      inferenceDetail: 'auto',
    });

    chatCtx.addMessage({
      role: 'user',
      content: [imageContent],
    });

    if (controller.signal.aborted) return;
    await this.updateChatCtx(chatCtx);
  }
}

```

** Filename: `Required imports`**

```typescript
import { Task, getJobContext, llm, voice } from '@livekit/agents';
import type { ByteStreamReader } from '@livekit/rtc-node';

```

### Sample video frames

LLMs can process video in the form of still images, but many LLMs are not trained for this use case and can produce suboptimal results in understanding motion and other changes through a video feed. Realtime models, like [Gemini Live](https://docs.livekit.io/agents/models/realtime/plugins/gemini.md), are trained on video and you can enable [live video input](#video) for automatic support.

If you are using an STT-LLM-TTS pipeline, you can still work with video by sampling the video track at suitable times. For instance, in the following example the agent always includes the latest video frame on each conversation turn from the user. This provides the model with additional context without overwhelming it with data or expecting it to interpret many sequential frames at a time:

** Filename: `agent.py`**

```python
class Assistant(Agent):
    def __init__(self) -> None:
        self._latest_frame = None
        self._video_stream = None
        self._tasks = []
        super().__init__(instructions="You are a helpful voice AI assistant.")
    
    async def on_enter(self):
        room = get_job_context().room

        # Find the first video track (if any) from the remote participant
        remote_participant = list(room.remote_participants.values())[0]
        video_tracks = [publication.track for publication in list(remote_participant.track_publications.values()) if publication.track.kind == rtc.TrackKind.KIND_VIDEO]
        if video_tracks:
            self._create_video_stream(video_tracks[0])
        
        # Watch for new video tracks not yet published
        @room.on("track_subscribed")
        def on_track_subscribed(track: rtc.Track, publication: rtc.RemoteTrackPublication, participant: rtc.RemoteParticipant):
            if track.kind == rtc.TrackKind.KIND_VIDEO:
                self._create_video_stream(track)
                        
    async def on_user_turn_completed(self, turn_ctx: ChatContext, new_message: ChatMessage) -> None:
        # Add the latest video frame, if any, to the new message
        if self._latest_frame:
            new_message.content.append(ImageContent(image=self._latest_frame))
            self._latest_frame = None
    
    # Helper method to buffer the latest video frame from the user's track
    def _create_video_stream(self, track: rtc.Track):
        # Close any existing stream (we only want one at a time)
        if self._video_stream is not None:
            self._video_stream.close()

        # Create a new stream to receive frames    
        self._video_stream = rtc.VideoStream(track)
        async def read_stream():
            async for event in self._video_stream:
                # Store the latest frame for use later
                self._latest_frame = event.frame
        
        # Store the async task
        task = asyncio.create_task(read_stream())
        task.add_done_callback(lambda t: self._tasks.remove(t))
        self._tasks.append(task)

```

** Filename: `Required imports`**

```python
import asyncio
from livekit import rtc
from livekit.agents import Agent, get_job_context
from livekit.agents.llm import ImageContent

```

** Filename: `agent.ts`**

```typescript
class Assistant extends voice.Agent {
  private latestFrame: VideoFrame | null = null;
  private videoStream: VideoStream | null = null;
  private tasks: Set<Task<void>> = new Set();

  constructor() {
    super({
      instructions: 'You are a helpful voice AI assistant.',
    });
  }

  async onEnter(): Promise<void> {
    const room = getJobContext().room;

    // Find the first video track (if any) from the remote participant
    const remoteParticipants = Array.from(room.remoteParticipants.values());

    if (remoteParticipants.length > 0) {
      const remoteParticipant = remoteParticipants[0]!;
      const videoTracks = Array.from(remoteParticipant.trackPublications.values())
        .filter((pub) => pub.track?.kind === TrackKind.KIND_VIDEO)
        .map((pub) => pub.track!)
        .filter((track) => track !== undefined);

      if (videoTracks.length > 0) {
        this.createVideoStream(videoTracks[0]!);
      }
    }

    // Watch for new video tracks not yet published
    room.on(RoomEvent.TrackSubscribed, (track: Track) => {
      if (track.kind === TrackKind.KIND_VIDEO) {
        this.createVideoStream(track);
      }
    });
  }

  async onUserTurnCompleted(chatCtx: llm.ChatContext, newMessage: llm.ChatMessage): Promise<void> {
    // Add the latest video frame, if any, to the new message
    if (this.latestFrame !== null) {
      newMessage.content.push(
        llm.createImageContent({
          image: this.latestFrame,
        }),
      );
      this.latestFrame = null;
    }
  }

  // Helper method to buffer the latest video frame from the user's track
  private createVideoStream(track: Track): void {
    // Close any existing stream (we only want one at a time)
    if (this.videoStream !== null) {
      this.videoStream.cancel();
    }

    // Create a new stream to receive frames
    this.videoStream = new VideoStream(track);

    const readStream = async (controller: AbortController): Promise<void> => {
      if (!this.videoStream) return;

      for await (const event of this.videoStream) {
        if (controller.signal.aborted) return;
        // Store the latest frame for use later
        this.latestFrame = event.frame;
      }
    };

    // Store the async task
    const task = Task.from((controller) => readStream(controller));
    task.result.finally(() => this.tasks.delete(task));
    this.tasks.add(task);
  }
}

```

** Filename: `Required imports`**

```typescript
import { Task, getJobContext, llm, voice } from '@livekit/agents';
import type { Track, VideoFrame } from '@livekit/rtc-node';
import { RoomEvent, TrackKind, VideoStream } from '@livekit/rtc-node';


```

#### Video frame encoding

By default, the `ImageContent` encodes video frames as JPEG at their native size. To adjust the size of the encoded frames, set the `inference_width` and `inference_height` parameters. Each frame is resized to fit within the provided dimensions while maintaining the original aspect ratio. For more control, use the `encode` method of the `livekit.agents.utils.images` module and pass the result as a data URL:

** Filename: `agent.py`**

```python
image_bytes = encode(
    event.frame,
    EncodeOptions(
        format="PNG",
        resize_options=ResizeOptions(
            width=512, 
            height=512, 
            strategy="scale_aspect_fit"
        )
    )
)
image_content = ImageContent(
    image=f"data:image/png;base64,{base64.b64encode(image_bytes).decode('utf-8')}"
)

```

** Filename: `Required imports`**

```python
import base64
from livekit.agents.utils.images import encode, EncodeOptions, ResizeOptions

```

### Inference detail

If your LLM provider supports it, you can set the `inference_detail` parameter to `"high"` or `"low"` to control the token usage and inference quality applied. The default is `"auto"`, which uses the provider's default.

## Live video

Available in:
- [ ] Node.js
- [x] Python

> ℹ️ **Supported models**
> 
> Live video input requires a realtime model with video support, such as [Gemini Live](https://docs.livekit.io/agents/models/realtime/plugins/gemini.md) or the [OpenAI Realtime API](https://docs.livekit.io/agents/models/realtime/plugins/openai.md).

Set the `video_input` parameter to `True` in `RoomOptions` to enable live video input. Your agent automatically receives frames from the user's [camera](https://docs.livekit.io/transport/media/publish.md) or [screen sharing](https://docs.livekit.io/transport/media/screenshare.md) tracks, if available. Only the single most recently published video track is used.

By default the agent samples one frame per second while the user speaks, and one frame every three seconds otherwise. Each frame is fit into 1024x1024 and encoded to JPEG. To override the frame rate, set `video_sampler` on the `AgentSession` with a custom instance.

Video input is passive and has no effect on [turn detection](https://docs.livekit.io/agents/logic/turns.md). To leverage live video input in a non-conversational context, use [manual turn control](https://docs.livekit.io/agents/build/turns.md#manual) and trigger LLM responses or tool calls on a timer or other schedule.

The following example shows how to add Gemini Live vision to your [voice AI quickstart](https://docs.livekit.io/agents/start/voice-ai.md) agent:

** Filename: `agent.py`**

```python
class VideoAssistant(Agent):
    def __init__(self) -> None:
        super().__init__(
            instructions="You are a helpful voice assistant with live video input from your user.",
            llm=google.realtime.RealtimeModel(
                voice="Puck",
                temperature=0.8,
            ),
        ) 

server = AgentServer()

@server.rtc_session()
async def my_agent(ctx: JobContext):
    session = AgentSession()

    await session.start(
        agent=VideoAssistant(),
        room=ctx.room,
        room_options=room_io.RoomOptions(
            video_input=True,
            # ... noise_cancellation, etc.
        ),
    )

```

** Filename: `Required imports`**

```python
from livekit.agents import (
    AgentServer,
    AgentSession,
    room_io
)
from livekit.plugins import google

```

## Additional resources

The following documentation and examples can help you get started with vision in LiveKit Agents.

- **[Voice AI quickstart](https://docs.livekit.io/agents/start/voice-ai.md)**: Use the quickstart as a starting base for adding vision code.

- **[Byte streams](https://docs.livekit.io/transport/data/byte-streams.md)**: Send images from your frontend to your agent with byte streams.

- **[RoomIO](https://docs.livekit.io/agents/build.md#roomio)**: Learn more about `RoomIO` and how it manages tracks.

- **[Gemini Vision Assistant](https://docs.livekit.io/recipes/gemini_live_vision.md)**: A voice AI agent with video input powered by Gemini Live.

- **[Camera and microphone](https://docs.livekit.io/transport/media/publish.md)**: Publish camera and microphone tracks from your frontend.

- **[Screen sharing](https://docs.livekit.io/transport/media/screenshare.md)**: Publish screen sharing tracks from your frontend.

---

This document was rendered at 2026-02-04T17:57:50.318Z.
For the latest version of this document, see [https://docs.livekit.io/agents/multimodality/vision.md](https://docs.livekit.io/agents/multimodality/vision.md).

To explore all LiveKit documentation, see [llms.txt](https://docs.livekit.io/llms.txt).
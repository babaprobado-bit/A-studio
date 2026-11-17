# Social Media Studio

AI Studio adds a local content workspace for a review-first short-video pipeline.

## Flow

1. Write a topic, select a supported free/local text model in AI Studio, and generate a script package (hook, voiceover, scene plan, caption, hashtags and CTA).
2. Review and edit the draft. Drafts and processing references are stored in Capacitor Preferences on the device; provider and OpenShorts API keys are not copied into the social queue.
3. Submit a public video URL that you own or have permission to process. The app checks OpenShorts quota, requests vertical 9:16 clips, auto captions and an AI hook, then saves the returned job ID.
4. Check the asynchronous job. When complete, list clips and review each result.
5. Select a clip, choose TikTok, Instagram Reels and/or YouTube Shorts, edit the title/description, and either publish now or choose a future schedule time.
6. Every public publish/schedule action requires a separate confirmation in the UI. Follow each platform’s age rules, remove private details and location data, and obtain parent/guardian approval when required. AI Studio records the API response as a request receipt; it does not claim the post is live unless a platform result is independently confirmed.

## OpenShorts tools

`process_video`, `get_job_status`, `list_clips` and `get_quota` remain required for clipping. The wider official MCP server also advertises `create_upload` and `recut_clip`; this first UI uses secure HTTPS source URLs rather than file uploads. `publish_clip` is optional and is enabled only when the connected OpenShorts MCP server advertises it. The official server's `publish_clip` schema accepts `job_id`, `clip_index`, `platforms`, `title`, `description`, optional ISO-8601 `scheduled_date`, and `timezone`. The connected social accounts and platform permissions must be configured in OpenShorts/Upload-Post first.


## Text-to-video and image-to-video generation

Social Media Studio now includes a separate Runway Dev Gen-4.5 generation panel. It submits either a text prompt to `POST /v1/text_to_video` or an optional PNG/JPEG/WebP first-frame data URI to `POST /v1/image_to_video`, then polls `GET /v1/tasks/{id}` for the generated MP4. The image is capped at 4 MB by the client. The app stores only the Runway task metadata in the local social queue; the API key uses the existing Android Secure Storage helper and is never placed in a queue/export. Web preview keeps the key in session memory only.

The service is **usage-priced**, not an unlimited free video generator. Gen-4.5 costs 12 Runway Dev credits per second (1 credit = USD $0.01): 5 seconds is about $0.60, 8 seconds $0.96, and 10 seconds $1.20. The UI shows an estimate and requires a separate confirmation for every generation. The key/account and billing must be managed by a parent/guardian; the app does not create an account or purchase credits. An account may have promotional credits, but the app does not assume they exist.

Gen-4.5 outputs short visual clips (2–10 seconds); it does not itself create a finished narrated social post with generated speech/music. Voiceover remains a separate script/audio step. Runway task output URLs are temporary and can expire within 24–48 hours, so download the MP4 soon after completion. On native Android the bundled CapacitorHttp patch is enabled to use native HTTP instead of WebView CORS. Web preview uses browser fetch and remains subject to the provider's CORS policy. No real API request or device test is implied by the mock tests.

Each generation requires a typed prompt or reference image, visible cost estimate, guardian-managed account approval checkbox and a second confirmation dialog. The app never launches video generation in the background.

## Important scope limits

- The current flow also offers separate Runway Gen-4.5 text-to-video and image-to-video generation, then can send the resulting MP4 through OpenShorts for vertical clipping/captions. It does not create a finished AI-actor UGC video from text. That is a separate OpenShorts AI Shorts feature with additional external video/voice providers; it is not exposed by the current MCP tools used here.
- Cloud processing and publishing are external service actions. Check the account's quota and terms; a free allowance can change and is not guaranteed by AI Studio.
- No secret is stored in the Social Studio queue or exported with its drafts.
- The user must have the rights to process and publish the source video. Do not post content that impersonates someone, exposes private information or uses unlicensed material.
- Scheduling is submitted to OpenShorts. The app does not run a background timer and does not guarantee an account/platform's final publish status.
- This is source/CI coverage only. No physical-device acceptance is claimed.

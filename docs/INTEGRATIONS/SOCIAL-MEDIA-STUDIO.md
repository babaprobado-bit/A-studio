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

## Important scope limits

- The current MCP flow creates scripts/storyboards with the selected AI text model and turns a supplied video into vertical clips. It does not create a finished AI-actor UGC video from text. That is a separate OpenShorts AI Shorts feature with additional external video/voice providers; it is not exposed by the current MCP tools used here.
- Cloud processing and publishing are external service actions. Check the account's quota and terms; a free allowance can change and is not guaranteed by AI Studio.
- No secret is stored in the Social Studio queue or exported with its drafts.
- The user must have the rights to process and publish the source video. Do not post content that impersonates someone, exposes private information or uses unlicensed material.
- Scheduling is submitted to OpenShorts. The app does not run a background timer and does not guarantee an account/platform's final publish status.
- This is source/CI coverage only. No physical-device acceptance is claimed.

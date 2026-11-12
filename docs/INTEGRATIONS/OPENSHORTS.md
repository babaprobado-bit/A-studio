# OpenShorts integration

AI Studio connects to the official OpenShorts Streamable HTTP MCP endpoint:
https://mcp.openshorts.app/mcp

## Setup
1. Create an OpenShorts API key from the OpenShorts account page. Hosted keys start with osk_.
2. In AI Studio → Tools, enter the key and choose Bağlan / araçları doğrula.
3. Check the quota before processing. The integration uses the account's existing OpenShorts minute balance.
4. Enter a public YouTube URL or a direct HTTPS MP4, MOV, M4V, WebM, or MKV URL.
5. Confirm that you own the video or have permission to process it, then start the 9:16 clipping job.
6. Check the job status and open the returned clip links when complete.

## Security and scope
- Android stores the OpenShorts key through the existing SecureStoragePlugin helper.
- Browser preview keeps the key in memory only; it is not persisted in Preferences or workspace backups.
- The key is sent only as an Authorization Bearer header to the official OpenShorts MCP endpoint. It is not sent to AI Team providers.
- The integration rejects non-HTTPS URLs, localhost, .local hosts, IP-literal hosts, and unsupported URL forms.
- Enabled tools: process_video, get_job_status, list_clips, get_quota, and add_subtitles. publish_clip and automatic social publishing are intentionally not exposed.
- OpenShorts performs video processing on its service. Processing can consume account minutes. Check current OpenShorts account terms and quota before starting jobs.
- No physical Android device acceptance is implied by JavaScript tests or CI results.

## Protocol
The client performs the stateless JSON-RPC MCP initialize handshake, sends notifications/initialized, reads tools/list, then invokes tools/call. It expects the official Streamable HTTP JSON response format.

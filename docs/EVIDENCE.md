# Verification evidence

## Verified native outcome

The final two-request extension on 14 October succeeded: a new Example Domain
question and a URL-free follow-up both returned sourced answers in Mac Messages.
The user explicitly confirmed both replies and source links visible on the iPad.
They also sent `/web help` from the iPad and confirmed its reply; the Mac UI and
new native receipt corroborate that help round trip. Research commands in this
extension were sent from Mac Messages, not from the iPad. Device receipt is
user-observed evidence; no iPad screenshot or recording was provided.

- `evidence/additional-request-authorization.json`: explicit two-request user
  approval and a read-only wallet check: positive balance, auto-reload unconfigured,
  no pending top-up. No purchase or top-up was performed.
- `evidence/ipad-followup-verification.json`: both exact public test commands,
  observed answers/sources, hashed native receipts, used-budget delta of exactly
  two, consumed follow-up context, and the user-confirmed device outcomes.
- `evidence/native-followup-redacted.png`: genuine Mac screenshot with complete
  new answer/follow-up message widths preserved. Sidebar/account header and older
  upper messages were cropped out; the raw original remains ignored/private.
  Source/export hashes and crop coordinates are in the verification JSON.

The final follow-up returned an answer visible on both devices, but its internal
send acknowledgment timed out (`dispatchAccepted=true`, one exact-body row,
zero eligible acknowledgment rows). Its durable receipt remains `send_uncertain`.
It was **not** retried, and visible delivery was not used to rewrite the receipt.
This remains an acknowledgment limitation, not a claim of confirmed SDK delivery.

### Earlier recorded run

The real Mac same-account iMessage self-chat received public URL/questions,
called live TinyFish, and visibly returned concise answers with source links.
Two native research questions succeeded: Example Domain and Photon’s iMessage
provider documentation. Help and a private-URL policy rejection also arrived in
Messages. This is a developer self-chat, not an independent cloud/peer identity.

- `evidence/demo-imessage-60s.mp4`: exactly 60 seconds of real Messages video.
  It shows the documentation question, TinyFish answer/source, then a later
  private-URL rejection. The jump is labeled; shown research latency is intact.
- `evidence/native-session-redacted.mp4`: full 140.067-second native recording,
  with original timing preserved. The user requested an alternative after the
  computer-use recording controls timed out. macOS’s built-in recorder captured
  only the Messages window; existing permission sufficed. No audio was captured.
- `evidence/recording-provenance.json`: source/export hashes, crop coordinates,
  exact source edit intervals and limitations. Captions are outside the native
  UI; no message content was inserted or replaced. The sidebar and account
  header are removed. Originals remain in ignored, owner-only `evidence/private`.
- `evidence/native-session-status.json`: native adapter revision, confirmed
  creation, final receipt counts and consumed three-request allowance. A local
  private-URL rejection consumed no research request.
- `evidence/native-research.json` / `native-research-redacted.png`: the first
  actual research reply, captured before the native recording and acknowledgment
  repair. Its old receipt remains uncertain despite the visibly received answer.
- `evidence/imessage-help.json` / `native-help-redacted.png`: initial real help
  testing; `native-help-send.json` preserves its old accepted-dispatch timeout.

The SDK’s new-row watcher misses later sent-status changes, and this same-account
chat reported `isSent=false` even for visible/read replies. The revised provider
confirms accepted dispatch plus an actual new outgoing native message ID, with
exact body/chat/timestamp checks. It reports the native sent flag separately.
This confirms provider creation, not physical iPad delivery. Earlier uncertain
receipts were retained and never retried. SDK internal send attempts are one.

## TinyFish, access and credit boundaries

Official current docs and the authenticated exact Photon brief were read;
requirements are transcribed in BRIEF.md. The existing wallet initially showed
$37 in welcome/student/mission promotional credits with auto-reload Off. No
purchase or top-up occurred. The existing API key was saved privately in an
owner-only shared credentials file, never printed or regenerated.

The initial six workflow attempts across the two project transports were three
successful terminal/browser runs, two successful Mac self-chat runs, and one
native URL-preserving follow-up that received a provider rate/quota failure.
That failure mapped from HTTP 429 after its request reservation; the exact
remote endpoint returning it was not separately logged. The bot replied clearly
and consumed the third native reservation. Both allowances are now exhausted;
no database was reset and no uncertain API/message outcome was retried.

The user later authorized exactly two additional native requests from existing
free credits. The native launcher alone received `MAX_REQUESTS=5` (three already
used plus two approved); the saved environment and console cap stayed unchanged.
Both requests succeeded. Totals are now **eight reservations: seven successful
research results and one provider HTTP 429**. Native usage is five, console usage
is three, and both allowances are exhausted. No additional API work is authorized
by this evidence or package.

`terminal-access.json` verifies read-only SELECT 1 from the user-started Terminal
launcher. `preflight.json` preserves the earlier ChatGPT-hosted access failure.
`mac-permission-granted.png` shows Terminal-only Full Disk Access; ChatGPT and
both Node entries remain disabled. Terminal’s existing Automation permission
for Messages is on. The exact observed self-conversation is stored privately.
The saved `.env` retains `ENABLE_IMESSAGE=false`; only the explicitly started
launcher process enables replies. No automatic startup was installed.

A Photon project was created on Free, with no cloud users enrolled. The requested
promo showed zero today and a paid renewal next month; no subscription/payment
was submitted. The exact observed renewal terms are recorded in SELF_CHAT.md.
No deployment, public repository publication, social post or bounty submission
occurred.

## Automated and console evidence

- `evidence/release-tests.txt`, `release-typecheck.txt`, `release-build.txt` and
  `release-verification.json`: 14 October hardening pass, **88/88 tests pass**,
  typecheck/build pass. New synthetic regressions cover malformed/zero wallet
  balances, the configured live-check cap, a lifetime allowance across UTC day
  rollover, distinct provider HTTP 429 replies, unvalidated mixed-case/scheme-relative
  links, and successful pages discussing CAPTCHA/login. No new live research or
  native sends were performed. These source changes are newer than the recording.

- `evidence/tests.txt`: historical live-recording build, 57 tests pass, covering routing, deduplication, context,
  rate/budget limits, interrupted/uncertain sends, timeout/credential/blocked
  responses, URL checks, native fixture integration, and the actual HTTP server.
  Provider responses and native fixture rows are synthetic and explicitly
  labeled; they do not prove external platform behavior.
- `evidence/typecheck.txt`, `build.txt`: TypeScript checks and build pass.
- `evidence/dependency-audit.json`: zero reported vulnerabilities after the
  transitive OpenTelemetry Core override; telemetry is disabled.
- `evidence/secret-check.json`: actual key and self-address absent from text
  deliverables, `.env.example` empty, credential permissions owner-only.
- `evidence/live-research.json`: genuine Example Domain research in 9,380 ms
  through explicitly offline terminal transport.
- `evidence/browser-live.txt`, `browser-desktop.png`, `browser-mobile.png`: genuine
  browser research and successful URL-preserving follow-up, duplicate suppression,
  and responsive layout. At 390×844, document width is 390 with no horizontal
  overflow. Browser transport is offline and is never iMessage proof.
- `evidence/offline-demo.txt`: explicitly fixture-only terminal simulation.

## Remaining limitations

Independent peer/cloud identity, iPad-originated research (help was iPad-originated),
and real provider credential-expiration/blocked-site/timeout behavior remain
unverified. Physical iPad receipt of help and both final research answers is
explicitly user-confirmed, not independently filmed. Successful native follow-up
is observed in Mac Messages, with the acknowledgment limitation stated above.
Automated fixtures cover the untested failure
paths; the native run genuinely exercised a local URL-policy block and a provider
rate/quota failure. The browser follow-up succeeded using the same routing engine.

Research is beta and the sample is small. No semantic benchmark, arbitrary-site
success guarantee, provider SSRF security audit, or bounty scoring guarantee is
claimed. Remote cancellation is best effort. The exact brief requires social
publication for submission; those actions still require the user’s approval.

> Publication status: see [PUBLICATION.md](docs/PUBLICATION.md). The user has authorized public sharing; final bounty submission waits for the scheduled LinkedIn post.

# Text the Web

A TypeScript public-page research assistant for Photon Spectrum iMessage.
Send a public HTTPS URL and a question; TinyFish checks the page, researches it,
and returns a short answer with source links. `help` explains the commands.
One follow-up reuses the URL for 15 minutes. It performs research only.

**Current evidence:** genuine TinyFish research works in the terminal and browser
sandbox. **Native self-chat pairing, command receipt, and a visible help reply work.**
Live TinyFish research also returned a sourced reply in Mac Messages.
The revised acknowledgment is verified. Watch the real
[60-second demo](evidence/demo-imessage-60s.mp4) or
[full timing-preserved recording](evidence/native-session-redacted.mp4).
See [same-account self-chat instructions](docs/SELF_CHAT.md).
The user-started Terminal launcher verified read-only Messages database access.
The exact native self-conversation is paired. A help request reached the bot,
and a help reply visibly arrived. Old acknowledgment timeouts are preserved;
no Photon cloud entitlement was verified.
After the initial three native attempts (two successes and one HTTP 429), the
user authorized exactly two additional requests from existing free credits.
Both succeeded: a new URL question and a URL-free follow-up. The user confirmed
both sourced replies visible on the iPad, and separately sent/received help
from the iPad. Research questions in this final pass were sent from Mac Messages.
iPad observations are user-confirmed, not independently recorded device footage.
The follow-up's internal send acknowledgment timed out despite visible replies
on both devices; its uncertain receipt was preserved and never resent.
All five native reservations are consumed. Budgets were not reset; further
research is paused. See [final native evidence](evidence/ipad-followup-verification.json).
See [acceptance checklist](docs/ACCEPTANCE.md), [exact brief](docs/BRIEF.md),
[verification evidence](docs/EVIDENCE.md), and [demo script](docs/DEMO.md).
Nothing was published, deployed, bought, topped up, posted, or submitted. A Free Photon project was created; the requested promo was applied to checkout, but the renewing subscription was not submitted.

The 14 October hardening pass passes **88 automated tests**, typecheck and build.
It fixes request-cap consistency, clear lifetime/provider-limit replies, invalid
wallet balances and unvalidated links in answer text. The two authorized final
native requests ran this hardened version; the video documents the earlier build.
The [local handoff](docs/HANDOFF.md) explains the source/evidence ZIP and remaining
live-test gates. `npm run release:pack` rebuilds that ZIP using Python 3.9+ without
network access, publication or live provider calls.

## Run locally

Requires Node.js 22.13+ (tested 22.14.0), npm, and an ordinary local checkout.
Node's built-in SQLite emits an experimental warning on Node 22.

```sh
npm ci
npm run check
npm test
npm run build
RESEARCH_MODE=fixture npm run dev
```

Open http://127.0.0.1:3100. The browser is an **offline messaging adapter**,
never a representation of an actual iMessage thread. Fixture mode supports only
`https://example.com/` questions about the domain's purpose/use; every fixture
answer identifies itself. Unsupported questions fail honestly. `npm run demo`
always runs the labeled terminal fixture simulation, without API calls.

The shipped `.env.example` is intentionally **zero bytes**. Create an ignored
`.env` for local settings. No secret is needed for fixture mode. The fixture console uses a separate `.data/fixture.sqlite` file; synthetic requests do not consume the live request budget.

## Existing shared TinyFish key

With the user's authorization, their **existing** API key was stored at
`~/.config/tinyfish/credentials.env` (directory 0700, file 0600). It was not
regenerated or printed. This application loads `.env`, then that shared file,
without overwriting already-set environment variables. Other server-side projects
can use the same file explicitly:

```ts
import { config } from 'dotenv';
import { homedir } from 'node:os';
import { join } from 'node:path';
config({ path: join(homedir(), '.config/tinyfish/credentials.env'), quiet: true });
```

Never load this file into frontend code. On another machine, provide an existing
key through `TINYFISH_API_KEY`; do not commit it or paste it into logs/chat.
No paid access is provisioned by the application.

## Enable genuine research

Only set these after verifying that the balance is existing approved promotional
credit and that account auto-reload is off. That verification was completed for
this user's current account ($37 in welcome/student/mission grants).

```dotenv
RESEARCH_MODE=live
FREE_CREDITS_APPROVED=true
MAX_REQUESTS=3
```

TinyFish is essential: without it, live research cannot produce an answer.
The official `@tiny-fish/sdk` handles authentication and transport with
`maxRetries: 0`. Fetch reads one supplied page with a 20-second per-URL timeout
and validates accessibility and the final redirect URL. Research **instant**
synthesizes a sourced answer restricted to that public host. It exposes only
search/fetch/answer tools, at most six model steps; no browser/action/payment,
Vault, profile, or credential tools are used. Research is beta; unsupported
accounts receive a clear failure, with no action-agent fallback.

SDK 0.8.0 has no dedicated research resource. This app uses its **public**
`post()`/`get()` methods with the exact official documented routes:

- `POST /v1/automation/run-research-async`
- `GET /v1/research-run/{research_run_id}`
- `POST /v1/research-run/{research_run_id}/cancel`

One request reserves budget durably **before** provider work. Default limits:
one research request/minute per conversation/sender, three per UTC day, **three
total for that adapter database**. Failed/uncertain requests consume budget.
`MAX_REQUESTS` accepts 1–10; this is an operator cap, not automatic replenishment.
No reset button is exposed. Do not delete budget state merely to run more calls.
The three console verification requests already consumed that transport's cap.
The separate genuine iMessage verification workflow initially had a three-request
lifetime cap. The user later approved exactly two more: the native launcher alone
used `MAX_REQUESTS=5`, with all previous budget records retained. Five native plus
three console reservations have now been consumed, eight total across transports.
Never create another database to replenish either allowance.

Each request uses at most one read-only wallet check, one Fetch, one Research
creation, 24 bounded polls, and one best-effort cancellation. Wallet checks
reject enabled/unknown auto-reload, pending top-ups, or non-positive/malformed balances. These
checks cannot independently prove credit provenance; the explicit operator
approval gate supplies that fact. There is no purchase/top-up API in this code.
The workflow deadline is 120 seconds; every SDK attempt times out after 25 seconds.
Fetch SDK 0.8.0 does not expose a caller signal: an in-flight Fetch can finish after
local cancellation, but it cannot then create research. Cancellation of a known
research run is attempted once with a five-second deadline. Unknown outcomes
are not retried. Remote cancellation is best effort, not guaranteed.

## Connect Photon iMessage

Use Photon **Stable** docs and packages, currently locked at 12.10.1.
Cloud and local providers have separate entrypoints. No credentials are passed
to the browser. Both adapters require all of the following local settings:

```dotenv
RESEARCH_MODE=live
FREE_CREDITS_APPROVED=true
ENABLE_IMESSAGE=true
TEST_CONVERSATION_ID=
TEST_SENDER_ID=
```

Fill in the **exact existing test conversation ID and sender ID**. Both must
match; unknown conversations/senders and the bot's outbound echoes are ignored
without a reply or research call. No new DM/group is created by this app.

For an existing entitled managed line, also configure `SPECTRUM_PROJECT_ID` and
`SPECTRUM_PROJECT_SECRET`; then run `npm run photon:cloud`. Credentials alone are
not proof of a managed-line entitlement; check the existing dashboard first.
The provider discovers lines and refreshes project tokens automatically.
Do not buy a plan or redeem a promo without separate authorization.

For this authorized Mac, also set `LOCAL_MAC_AUTHORIZED=true`, sign into Messages,
and make the Messages database readable to the runtime through the required
macOS permission flow. The user must perform any OS permission grant; this
application does not change security settings. Run `npm run preflight` to check
without printing or querying messages, then `npm run photon:local`.
Do not enable replies until the exact test target is provided. The local adapter
is macOS-only; it is separate from the cloud dependency graph.

### Prevent uncertain-send retries

Photon's current cloud provider hardcodes `retry: true` on native clients, and
its local native SDK defaults to three AppleScript dispatch attempts. The tracked
[safety patch script](scripts/patch-send-retries.mjs), applied on `npm ci`, changes
cloud retries to `false` and local dispatch attempts to one. It fails closed if
the expected package contents change; tests assert the patches are active.
This is a disclosed patch to official packages, not an invented API.

SQLite stores a unique event receipt and **send intent before dispatch**.
Duplicate IDs do not repeat research or replies, even after restart. Changed
payloads under a previously seen ID are conflicts. A send throw, missing SDK
confirmation, or 20-second local deadline becomes `send_uncertain`; it is never
retried. Crashes during research/send are labeled interrupted on restart and
require manual review. An SDK-created message is **not** device delivery proof.
Each adapter has an exclusive process lock to protect its persistent state.

## Security and limitations

- HTTPS only; reject userinfo, query strings/fragments, custom ports, local hosts,
  private/reserved addresses, mixed DNS answers, and cloud metadata. DNS is checked
  before TinyFish sees the target. Validate final URLs and citations too; cross-host
  redirects are rejected. Only validated source URLs are sent in replies.
- Retrieval happens at TinyFish, not on this Mac. DNS cannot be pinned at a remote
  provider by this app. Remote DNS-rebinding/redirect enforcement depends on TinyFish's
  documented private-target protections; this is not a verified provider SSRF audit.
- Research domain filtering limits the requested public host. Website text, titles,
  and questions are explicitly untrusted data. The model has only read-only research
  tools. It cannot make purchases, bookings, logins, account changes, or messages.
- Model text is never HTML/JavaScript; the browser uses DOM text nodes, CSP and
  validated source links. Missing/unsafe citations and inaccessible pages fail closed.
- Provider logs are disabled where configurable; telemetry is off. Application logs
  contain fixed status codes rather than keys, identifiers, messages, or raw errors.
  Persistent receipts hash IDs/content; only the previous public URL is retained
  for context. The UI transcript is ephemeral. Keep `.data` private.
- The local UI binds `127.0.0.1`, checks Host/Origin and a session token, accepts only
  small JSON requests, and never accepts supplied platform/conversation/sender values.
- Source presence does not prove every model claim. Small manual samples are not
  semantic evaluations of arbitrary sites. Prompt injection resistance and live
  iMessage delivery are not claimed as independently validated.
- The brief's current named endpoints include Search/Fetch/Agent. Fetch satisfies
  that requirement; Research scoring eligibility remains unconfirmed. No points claimed.

## Verification

```sh
npm test                  # provider-contract responses are labeled fixtures
npm run check
npm run build
npm run preflight         # key presence / Mac access; never credential values
npm run demo              # always fixture-only, not iMessage
npx tsx scripts/live-check.ts  # optional: consumes approved live budget; stop server first
npm audit
```

The live-check script writes genuine public-page results to
`evidence/live-research.json`. It must not be confused with the automated tests'
synthetic provider responses. The UI is also usable with live research, but its
transport remains offline. The actual Mac self-chat recording is linked above;
the later native follow-up succeeded, with iPad receipt explicitly user-confirmed.
See `docs/DEMO.md` for the recording script and publication approval gates.

The optional `npm run self:run` launcher pairs and starts the same-account test
mode using official Photon native callbacks and Spectrum provider authoring.
Run it from the approved Terminal host, not this ChatGPT-hosted executor.
See `docs/SELF_CHAT.md` for the exact command and evidence boundaries.

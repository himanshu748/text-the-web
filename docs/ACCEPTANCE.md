# Acceptance checklist — verified brief, 12 October 2026

The exact current brief was read after sign-in. See [BRIEF.md](BRIEF.md) for
the transcribed requirements and [EVIDENCE.md](EVIDENCE.md) for actual outcomes.
No bounty has been claimed or submitted. Initial provisional scope has now been
reconciled against the brief; publication is intentionally approval-gated.

| Acceptance condition | Verification / gate |
|---|---|
| TypeScript runnable MVP using current Photon Spectrum and official TinyFish SDK | Locked packages, typecheck, README commands |
| Public URL + question produces concise answer with source links | Genuine TinyFish research verified in browser/terminal and two actual Mac self-chat questions |
| TinyFish is essential, no hidden canned production answers | Official research API only in live mode; separate explicit fixture implementation |
| Help and one follow-up using prior URL | Native and browser follow-ups succeeded. iPad help round trip and final research receipt explicitly user-confirmed; earlier native HTTP 429 retained as failure evidence |
| Research only; no purchases/bookings/account mutations | Research instant mode exposes only search/fetch/answer; no agent/browser/payment API |
| Existing Photon cloud line or explicitly authorized Mac | Preflight; cloud and local entrypoints disabled by default |
| Offline adapter clearly labeled when access unavailable | Browser sandbox and terminal demo label messaging and research independently |
| Exact conversation AND sender allowlist; ignore own messages | Router/adapter tests; optional same-account self mode accepts explicit `/web` human commands only and suppresses bot replies |
| Durable deduplication; no uncertain send retry | SQLite receipt and send-intent states; restart/duplicate tests |
| Bounded requests, persistent daily budget, no purchase/top-up | Three research requests total by default, no SDK retries, free-credit approval gate |
| Clear failures for timeout, expired credentials, blocked website | Provider transport tests and router reply tests |
| URL SSRF validation | HTTPS-only, no credentials/query secrets, DNS/IP policy, validate source URLs; provider must protect retrieval redirects |
| Website content untrusted; no secret leakage | Read-only research tools, fixed prompt rules, bounded output, text-only rendering, logs contain only fixed codes |
| Responsive UI, README, tests, demo script, redacted evidence | Browser checks plus test/demo artifacts |
| Actual iMessage end-to-end recording | Real Mac self-chat video: public URL → live TinyFish research → sourced Messages reply; no iPad or separate-peer claim |
| Publication, deployment, social posting, bounty submission | Require explicit user approval; not performed |

## Current access observations

- Empty Git repository, no AGENTS.md or contribution guide in workspace/ancestor directories.
- TinyFish key now loaded from an owner-only shared credentials file; Photon credentials absent.
- TinyFish and Photon dashboards were inspected after sign-in. A Free Photon project was created; no cloud user was enrolled.
- Mac authorization and Terminal-only Full Disk Access granted. The user-started Terminal launcher passed read-only SELECT 1; the ChatGPT-hosted process remains denied.
- Wallet verified: $37 promotional credits, auto-reload Off. Existing key saved privately. Promo checkout showed zero today with a paid renewal next month; no subscription submitted.
- Exact native self-chat pairing succeeded. Real help and two TinyFish research replies visibly arrived in Mac Messages. Revised acknowledgment confirms accepted dispatch plus actual outgoing native message creation. Native sent/delivery flags are separate; earlier uncertain receipts are preserved.

## Official contracts read

- https://docs.tinyfish.ai/for-coding-agents
- https://docs.tinyfish.ai/research-api/reference (instant is beta, account enablement required)
- https://photon.codes/docs/spectrum-ts/providers/imessage (Stable)
- https://photon.codes/docs/spectrum-ts/getting-started (Stable)
- https://photon.codes/docs/spectrum-ts/messages (Stable)

Live research will use instant research: only search/fetch/answer, at most six
model steps per run. It avoids giving an autonomous browser permission to click,
book, buy, sign in, or submit forms. Account enablement and pricing must be
checked before using approved free credits. No fallback silently expands scope.

## Current verdict

Local hardening rechecked 14 October: 88 automated tests, typecheck and build pass.
The user subsequently authorized exactly two additional native requests, both
successful; five native reservations are now consumed. See HANDOFF.md for the
local package. The video remains the earlier recorded run; later results have
native receipts, a redacted screenshot, and explicit user confirmation on iPad.

- [x] Exact current signed-in brief read and transcribed.
- [x] Runnable TypeScript code, responsive UI, README, automated checks and demo script.
- [x] Genuine TinyFish URL research and one URL-preserving follow-up (offline browser transport).
- [x] Help, allowlisting, deduplication, budgets, failure replies, SSRF checks and no uncertain-send retries verified in automated tests.
- [x] Server-side existing key, empty .env.example, promotional credits and auto-reload Off verified.
- [x] Authorized Terminal launcher verified read-only Messages database access.
- [x] Exact native self-chat paired; real human command received and recorded.
- [x] Live Mac self-chat request → TinyFish research → visible sourced reply (two successful questions).
- [x] Revised provider-creation acknowledgment verified on the native transport.
- [x] Real iMessage recording; help, two public URL questions and a local URL-policy failure verified natively.
- [x] Native URL-free follow-up success: completed in the two-request extension. Its internal acknowledgment timed out despite visible reply; uncertain receipt retained and no resend.
- [x] iPad-originated help and reply: explicitly user-confirmed and corroborated by native receipt. Both final research replies/source links also user-confirmed on iPad. No iPad recording supplied.
- [ ] Independent peer/cloud identity and iPad-originated research question: untested. Final research commands originated on the Mac.
- [ ] Social posts / submission / publication: await explicit approval; none performed.

# Same-account iPad + Mac test mode

The user's Wi-Fi iPad and Mac use the same Apple Messages account. No second
Apple account or phone is required for this explicitly labeled self-chat mode.
It is a developer test mode, not a managed external bot identity. Peer-to-peer
inbound cloud/local delivery remains a separate untested claim.

The standard Photon local provider subscribes to peer incoming messages only.
This optional custom provider uses the documented Photon Spectrum
`definePlatform` API and Photon native `IMessageSDK.onFromMeMessage` callback.
These are official APIs, not invented endpoints.

Only fresh, text-only, non-error **iMessage** rows in the exact paired DM to the
configured active self-address are eligible. Every human command must start
`/web `. The adapter converts that explicit command into application input;
it does not treat general outbound messages as incoming. Every bot reply is
prefixed `Text the Web · reply`, outside the command grammar. Even an injected
model answer starting `/web` cannot feed back into the request stream.

The native watcher remains free while Spectrum applies stream backpressure.
SDK 3.0.0 advances a new-row cursor, so it can miss an existing row's later
`isSent` update. After one dispatch, the adapter makes at most 15 read-only SDK
queries, each restricted to five fresh outgoing iMessages in this paired chat.
Exact body, chat, timestamp, and eligibility must match uniquely. The SDK must
also accept the one dispatch. Native `isSent` is recorded separately because
it did not match the visible self-chat results; it is never assumed true.
These queries never dispatch another message. The command buffer is bounded at four. A send
resolves only after accepted dispatch plus an actual outgoing chat.db row with matching conversation/body
and a new timestamp is observed. Its native message ID is retained by Spectrum.
This confirms local DB arrival, **not delivery to the iPad**. A missing ack is
uncertain and never retried. SDK internal send attempts remain patched to one.

## Current access choice

The user explicitly approved Full Disk Access, then chose **Terminal only** when
macOS still denied a Node child launched by ChatGPT. Terminal is enabled;
ChatGPT and both Node entries are disabled. Native computer-use control of
Terminal was refused by the tool for safety reasons. No alternate mechanism is
used to bypass that restriction. The user must start the runtime in Terminal.

The active Mac Messages address was read from the enabled “Start new
conversations from” setting and stored only in the ignored `.env`, mode 0600.
It is not printed in these docs or logs. No unrelated chat was modified.

## One-command launcher

In **Terminal**, paste this single command from the project root context:

```sh
cd text-the-web && node --import tsx scripts/run-self.ts
```

The launcher checks read-only database access. If not paired, it prints a fresh
`/web pair <nonce>` command and watches for ten minutes. From the iPad or Mac, send that
exact command to the enabled iMessage email on your own Messages account. The
pairing script sends nothing and makes no TinyFish calls. It stores the **actual
observed native conversation ID**, plus `TEST_SENDER_ID=self`, privately.

After pairing, the launcher enables replies in that process and starts the
adapter automatically. Send `/web help` first: this verifies transport without
using research credits. Then send `/web https://example.com/ What is the purpose
of this domain?`. One follow-up without a URL is supported after the cooldown.

If macOS asks to allow Terminal to control Messages, review and complete that
local permission prompt yourself. Do not share any Mac password here. Keep
Terminal running. Stop the bot with Ctrl-C. `ENABLE_IMESSAGE` remains false in
the saved `.env`; automatic startup is never enabled.

The user ran the launcher in Terminal: read-only database access passed. The
window is ten minutes to allow time for the manual Terminal handoff. A fresh
challenge sent through the actual Mac Messages UI successfully paired the native
self-conversation. A subsequent `/web help` command reached the application;
its first receipt is `send_uncertain`. A separate new `/web hi` test visibly
returned the real help reply; its receipt also timed out under the old watcher-only
acknowledgment logic. A real public URL/question then returned a visible sourced
TinyFish answer in Messages. All earlier uncertain receipts remain preserved. Terminal's Messages automation
permission is already on. Three research attempts were used on this transport:
two successes and a provider rate/quota failure on the follow-up.
The uncertain events are never retried. The provider-creation acknowledgment
fix passed automated checks and native verification. It confirms accepted
dispatch plus actual outgoing native creation; `isSent` remains a separate
observed flag. It was false even with visible/read replies in this self-chat.

The provider writes only fixed send outcome codes to `evidence/self-send.json`.
Raw SDK errors can contain private recipients or AppleScript bodies and are
never logged. A sent database row still does not establish iPad delivery.

Seven automated tests exercised the real Spectrum/engine integration with
explicit synthetic native-message fixtures, loop suppression, blocked peers/
SMS/old rows, and uncertain send acknowledgment. The recorded build passed 57
tests; the 14 October hardening pass now passes 88 with no new live sends. The actual
Mac self-chat research/reply loop and revised acknowledgment are verified.
The real 60-second demo and full native recording are linked in EVIDENCE.md.
The initial three-request cap was consumed. The user later authorized exactly
two more requests. Only the native launcher process received `MAX_REQUESTS=5`;
the shared `.env`, console cap and all budget records remained unchanged.
Both additional requests succeeded: a fresh URL question and a URL-free follow-up
after the cooldown. The user confirmed both answers/source links visible on iPad,
and separately sent/received `/web help` from iPad. These are user-reported device
observations, not iPad footage. Research commands originated on the Mac.
The follow-up's internal acknowledgment timed out despite visible replies; that
uncertain receipt is preserved and no resend occurred. All five native
reservations are now consumed. See `ipad-followup-verification.json` and the
genuine `native-followup-redacted.png` in evidence.

## Photon promo observation

A new Text the Web project was created on **Free** after authorization. No users
were enrolled. The bounty promo applied successfully to a Pro checkout:
₹0 today, then ₹2,487.54/month starting next month at the displayed exchange rate.
No subscription or payment was submitted. The pending checkout was left for
review, not activated. Current cloud onboarding reports `account_phone_missing`;
its Add user form stayed disabled with only an email filled in. That form probe
used a public example fixture and was canceled; no invite or user was created.

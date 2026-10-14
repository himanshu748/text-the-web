# Demo and recording script

## Local console walkthrough (honest current proof)

1. Run `npm run dev` with the existing approved live-research configuration.
2. Open http://127.0.0.1:3100. Show both badges: live TinyFish research and offline browser transport.
3. Send `https://example.com/ Do I need permission to use this domain in documentation?`.
4. Show the response and source. Check the cited page independently.
5. Replay the event: verify no second research call or reply.
6. After the one-minute research cooldown, ask one question without a URL.
7. Show help and a blocked private URL; these must not call TinyFish.

The recorded console transcript is genuine TinyFish research but **not iMessage
proof**. Fixture mode and `npm run demo` demonstrate routing only and say so.
The default three-request lifetime cap may already be consumed by verification;
do not reset it without reviewing and approving further free-credit usage.

## Same-account self-chat walkthrough

Run the Terminal launcher in SELF_CHAT.md. Immediately send its fresh pairing
challenge from the iPad to the enabled email on the same Messages account.
Keep Terminal running. Send `/web help` and verify the prefixed reply appears
in Messages before making any research request. Then send:

`/web https://example.com/ What is the purpose of this domain?`

After the one-minute cooldown, send `/web Can I use it in documentation?`.
The Messages transport has at most three lifetime research requests; do not
reset its database. Show that this is a same-account developer self-chat;
do not describe it as a managed cloud bot or a separate peer identity.

## Delivered real native recording

`evidence/demo-imessage-60s.mp4` is exactly 60 seconds. It uses actual Mac
Messages video from source intervals 20–65 and 121–136 seconds. The jump to the
later URL-policy check is labeled explicitly. The source shows the public
documentation question, live TinyFish answer and source link, then a private
URL rejected locally without a TinyFish call. No terminal/browser content was
inserted into Messages.

`evidence/native-session-redacted.mp4` preserves the full 140.067-second timing.
Both exports crop the sidebar and account header. Captions are outside the
native UI. `recording-provenance.json` records source/export hashes and edits.
This is a same-account **Mac** developer self-chat; physical iPad delivery and
an independent cloud/peer identity are not claimed. The later native follow-up
received a provider rate/quota failure and is outside this recording; its
receipt remains in `native-session-status.json`. Do not portray it as successful.

Both current research allowances are consumed. Before future recordings,
review and authorize further existing free-credit usage before changing any
cap. Do not reset the databases or buy credits.

## Future recording script

Update after the existing video: the user approved two more native requests.
Both the new URL question and URL-free follow-up succeeded, with iPad receipt
explicitly user-confirmed. The still image `native-followup-redacted.png` and
`ipad-followup-verification.json` document this later run; it is not in the video.
The follow-up acknowledgment remained uncertain and was not retried. Five native
reservations are now used, and no research allowance remains.

Preconditions: exact test conversation and sender approved, existing Photon
entitlement OR authorized/readable local Messages account, live TinyFish key and
approved promotional balance, patched providers, preflight passes. Turn on
`ENABLE_IMESSAGE` only after these checks. No buying or provisioning access.

- 0–10s: show the real iMessage thread and explain the student's question.
- 10–20s: send a real public URL + a specific question from the approved sender.
- 20–40s: show the genuine research stage using redacted status/evidence (no keys,
  phone/email identifiers, unrelated chats, project secrets, or browser sessions).
- 40–50s: show the reply **actually appearing in Messages**, with source links.
- 50–60s: show one follow-up reusing the URL and explain the useful result.

Timing depends on actual research latency and the one-minute cooldown; pre-record
complete runs, then edit their real footage clearly without suggesting a shorter
latency or removing failures. Never insert a terminal/browser result into the
Messages recording. Local send dispatch / SDK message ID alone is not sufficient.
If an actual reply does not arrive, record the failure and report the boundary.

Posting the video to X/LinkedIn, tagging companies, claiming/submitting the bounty,
public repository publication, or deployment needs separate user approval. The
brief requires social posts for final submission; none has been performed.

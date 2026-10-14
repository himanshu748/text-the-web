export type Event = { id: string; platform: 'offline' | 'imessage' | 'local_imessage' | 'local_self_imessage'; conversation: string; sender: string; direction: 'inbound' | 'outbound'; text: string };
export type Answer = { text: string; sources: string[]; mode: 'fixture' | 'live' };
export interface Researcher { mode: 'fixture' | 'live'; research(url: string, question: string, signal: AbortSignal): Promise<Answer> }
export type Send = (text: string) => Promise<'confirmed' | 'uncertain'>;
export class Failure extends Error { constructor(public code: string) { super(code); } }
export const replies: Record<string, string> = {
  invalid_url: 'Use one public HTTPS URL without credentials, query parameters, or a custom port.',
  blocked_url: 'That URL is blocked by the public-web safety policy. Try a public HTTPS page.',
  dns: 'I could not resolve that website safely. Try another public page.',
  timeout: 'Research timed out. I have not sent an answer. You can send a new request later.',
  credentials: 'Research credentials are missing or expired. The operator must reconnect TinyFish.',
  blocked: 'That website is blocked, requires login, or denied access. Try a public page.',
  credits: 'The approved free-credit budget is exhausted. Research is paused; no top-up will be attempted.',
  unavailable: 'TinyFish research is unavailable or not enabled for this account. Try again later.',
  no_answer: 'I could not verify a sourced answer on that page. Try a more specific question.',
  rate_limit: 'Please wait a minute before asking another research question.',
  budget: 'The configured research request limit is reached. Research is paused until the operator reviews the allowance; it does not reset tomorrow.',
  provider_rate_limit: 'TinyFish declined this request because of a provider rate or quota limit. I have not retried it; this attempt still counts toward the local allowance.',
  scope: 'I can research public pages only. I cannot buy, book, send messages, sign in, or change accounts.',
  followup: 'Send a public HTTPS URL and a question first. I support one follow-up within 15 minutes.',
};

import { z } from 'zod';
import { Store } from './store.js';
import { Failure, replies, type Event, type Researcher, type Send } from './types.js';
import { safeUrl } from './url-policy.js';
export const eventSchema = z.object({id:z.string().min(1).max(200), platform:z.enum(['offline','imessage','local_imessage','local_self_imessage']),conversation:z.string().min(1).max(250),sender:z.string().min(1).max(250),direction:z.enum(['inbound','outbound']),text:z.string().max(2000)}).strict();
export const HELP = 'Text the Web: send one public HTTPS URL followed by a question. I return a concise answer with sources. Ask one follow-up within 15 minutes using that same page. Research only; no purchases, bookings, logins, or account changes. Send help anytime.';
export class Engine {
  constructor(public store: Store, public researcher: Researcher, private allowed: { platform: string; conversation: string; sender: string }, private options: { maxDaily?:number; timeout?:number; sendTimeout?:number; now?:()=>number; validate?:(u:string)=>Promise<string> } = {}) {}
  get limit(){return this.options.maxDaily ?? 3;}
  get remaining(){return Math.max(0,this.limit-this.store.used());}
  async handle(input: unknown, send: Send) {
    const parsed = eventSchema.safeParse(input);
    if (!parsed.success) return {state:'invalid'};
    const e: Event = parsed.data;
    if (e.direction !== 'inbound' || e.platform !== this.allowed.platform || e.conversation !== this.allowed.conversation || e.sender !== this.allowed.sender) return {state:'ignored'};
    const claim = this.store.claim(e);
    if (claim !== 'new') return {state:claim};
    let reply: string, code = 'ok';
    const now = (this.options.now ?? Date.now)();
    try {
      if (/^(help|\/help|hi|hello)$/i.test(e.text.trim())) reply = HELP;
      else {
        if (/^(?:please\s+|(?:can|could|will|would)\s+you\s+)?(buy|purchase|book|reserve|checkout|pay|send|delete|sign.?in|log.?in|change.*account)\b/i.test(e.text.replace(/https?:\/\/\S+/g,'').trim())) throw new Failure('scope');
        const urls = e.text.match(/https?:\/\/\S+/g) ?? [];
        if (urls.length > 1) throw new Failure('invalid_url');
        const context = this.store.context(e, now);
        if (!urls.length && (!context || context.remaining < 1)) throw new Failure('followup');
        const raw = urls[0] ?? context!.url;
        const question = (urls.length ? e.text.replace(raw, '') : e.text).trim();
        if (question.length < 3 || question.length > 450) throw new Failure('no_answer');
        const url = await (this.options.validate ?? safeUrl)(raw);
        const reservation = this.store.reserve(e, now, this.options.maxDaily ?? 3);
        if (reservation !== 'ok') throw new Failure(reservation);
        if (urls.length) this.store.remember(e, url, now); else this.store.follow(e);
        this.store.state(e, 'researching');
        const controller = new AbortController();
        let timer: ReturnType<typeof setTimeout>;
        try {
          const result = await Promise.race([
            this.researcher.research(url, question, controller.signal),
            new Promise<never>((_, reject) => { timer = setTimeout(() => { controller.abort(); reject(new Failure('timeout')); }, this.options.timeout ?? 120000); }),
          ]);
          if (!result.text || !result.sources.length) throw new Failure('no_answer');
          reply = `${result.mode === 'fixture' ? '[OFFLINE FIXTURE — no live research]\n' : ''}${result.text}\n\nSources:\n${result.sources.join('\n')}`;
        } finally { clearTimeout(timer!); }
      }
    } catch (err) {
      code = err instanceof Failure ? err.code : 'unavailable';
      reply = replies[code] ?? replies.unavailable;
    }
    // Persist intent BEFORE a non-transactional send. Any crash or ambiguity requires manual review.
    this.store.state(e, 'send_intent', code);
    try {
      let timer:ReturnType<typeof setTimeout>;
      let result:'confirmed'|'uncertain';
      try{result=await Promise.race([send(reply),new Promise<'uncertain'>(resolve=>{timer=setTimeout(()=>resolve('uncertain'),this.options.sendTimeout??20000);})]);}finally{clearTimeout(timer!);}
      const state = result === 'confirmed' ? 'sent' : 'send_uncertain';
      this.store.state(e, state, code); return {state,code};
    } catch { this.store.state(e, 'send_uncertain', code); return {state:'send_uncertain',code}; }
  }
}

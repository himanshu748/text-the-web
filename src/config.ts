import './env.js';
import { z } from 'zod';
import { Engine } from './engine.js';
import { Store } from './store.js';
import { FixtureResearch, TinyFishResearch } from './research.js';
export function researcher() {
  const mode = process.env.RESEARCH_MODE || 'fixture';
  if (mode === 'fixture') return new FixtureResearch();
  if (mode !== 'live') throw new Error('configuration_invalid_research_mode');
  if (process.env.FREE_CREDITS_APPROVED !== 'true' || !process.env.TINYFISH_API_KEY) throw new Error('live_research_requires_key_and_verified_free_credit_approval');
  return new TinyFishResearch(process.env.TINYFISH_API_KEY);
}
export function requestCap(){return z.coerce.number().int().min(1).max(10).parse(process.env.MAX_REQUESTS ?? '3');}
export function liveEngine(platform:'imessage'|'local_imessage'|'local_self_imessage') {
  if (process.env.ENABLE_IMESSAGE !== 'true') throw new Error('live_messaging_disabled');
  if (process.env.RESEARCH_MODE !== 'live') throw new Error('live_messaging_requires_live_research');
  const conversation = process.env.TEST_CONVERSATION_ID, sender = process.env.TEST_SENDER_ID;
  if (!conversation || !sender) throw new Error('exact_test_conversation_and_sender_required');
  const maxDaily = requestCap();
  return new Engine(new Store('.data/imessage.sqlite'),researcher(),{platform,conversation,sender},{maxDaily});
}

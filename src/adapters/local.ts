import { acquireLock } from '../lock.js';
import { Spectrum } from '@spectrum-ts/core';
import { localIMessage } from '@spectrum-ts/imessage-local';
import { liveEngine } from '../config.js';
import { receive } from './spectrum.js';
try {
  if (process.platform !== 'darwin' || process.env.LOCAL_MAC_AUTHORIZED !== 'true') throw new Error('authorized_mac_required');
  acquireLock('.data/imessage.lock');
  const engine = liveEngine('local_imessage');
  const app = await Spectrum({providers:[localIMessage.config()],telemetry:false,options:{logLevel:'silent'}});
  console.log(JSON.stringify({code:'local_adapter_started',scope:'allowlisted_test_only'}));
  for await (const [space,message] of app.messages) await receive(engine,space,message);
} catch { console.error(JSON.stringify({code:'local_adapter_unavailable_check_preflight'})); process.exitCode=1; }

import { acquireLock } from '../lock.js';
import { Spectrum } from '@spectrum-ts/core';
import { imessage } from '@spectrum-ts/imessage';
import { liveEngine } from '../config.js';
import { receive } from './spectrum.js';
try {
  acquireLock('.data/imessage.lock');
  const engine = liveEngine('imessage');
  const projectId=process.env.SPECTRUM_PROJECT_ID, projectSecret=process.env.SPECTRUM_PROJECT_SECRET;
  if (!projectId || !projectSecret) throw new Error('cloud_project_credentials_required');
  const app = await Spectrum({projectId,projectSecret,providers:[imessage.config()],telemetry:false,options:{logLevel:'silent'}});
  console.log(JSON.stringify({code:'cloud_adapter_started',scope:'allowlisted_test_only'}));
  for await (const [space,message] of app.messages) await receive(engine,space,message);
} catch { console.error(JSON.stringify({code:'cloud_adapter_unavailable_check_preflight'})); process.exitCode=1; }

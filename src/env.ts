import { config } from 'dotenv';
import { homedir } from 'node:os';
import { join } from 'node:path';
config({quiet:true});
// Existing shared credential; read only, never copied into a public bundle or logs.
config({path:join(homedir(),'.config/tinyfish/credentials.env'),quiet:true});

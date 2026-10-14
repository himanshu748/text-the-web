import { lookup } from 'node:dns/promises';
import ipaddr from 'ipaddr.js';
import { Failure } from './types.js';
export type Resolver = (host: string) => Promise<string[]>;
const resolve: Resolver = async host => (await lookup(host, { all: true })).map(x => x.address);
export function publicAddress(address: string): boolean {
  try {
    let ip = ipaddr.parse(address);
    if (ip.kind() === 'ipv6' && (ip as ipaddr.IPv6).isIPv4MappedAddress()) ip = (ip as ipaddr.IPv6).toIPv4Address();
    return ip.range() === 'unicast';
  } catch { return false; }
}
export async function safeUrl(raw: string, resolver: Resolver = resolve): Promise<string> {
  if (raw.length > 1500 || /[\s\\]/u.test(raw)) throw new Failure('invalid_url');
  let u: URL;
  try { u = new URL(raw); } catch { throw new Failure('invalid_url'); }
  if (u.protocol !== 'https:' || u.username || u.password || (u.port && u.port !== '443') || u.search || u.hash) throw new Failure('invalid_url');
  const host = u.hostname.replace(/^\[|\]$/g, '').toLowerCase();
  if (!host || !host.includes('.') || /(^|\.)(localhost|local|internal|test|invalid|onion|home|lan)$/.test(host) || host.endsWith('.') || host === 'metadata.google.internal') throw new Failure('blocked_url');
  let addresses: string[];
  if (ipaddr.isValid(host)) addresses = [host];
  else {
    try { addresses = await Promise.race([resolver(host), new Promise<never>((_, reject) => { const t = setTimeout(() => reject(new Failure('dns')), 4000); t.unref(); })]); }
    catch { throw new Failure('dns'); }
  }
  if (!addresses.length || addresses.some(x => !publicAddress(x))) throw new Failure('blocked_url');
  return u.href;
}

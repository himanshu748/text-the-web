import type { Message, Space } from '@spectrum-ts/core';
import type { Event } from '../types.js';
import type { Engine } from '../engine.js';
export function normalize(space: Pick<Space,'id'>, message: Pick<Message,'platform'|'id'|'direction'|'sender'|'content'>): Event | undefined {
  if (!['imessage','local_imessage','local_self_imessage'].includes(message.platform) || message.content.type !== 'text' || !message.sender?.id) return;
  return {id:message.id,platform:message.platform as Event['platform'],conversation:space.id,sender:message.sender.id,direction:message.direction,text:message.content.text};
}
export async function receive(engine: Engine, space: Space, message: Message) {
  const event = normalize(space,message);
  if (!event) return;
  return engine.handle(event, async text => {
    // Send exactly once. SDK-confirmed creation is not proof of device delivery.
    const sent = await space.send(text);
    return sent?.id ? 'confirmed' : 'uncertain';
  });
}

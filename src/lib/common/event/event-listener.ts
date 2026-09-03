export const EventListenerToken = Symbol('EventListener');

export interface EventListener {
  listen(): void;
}

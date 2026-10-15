export class SpamTracker {
  constructor({ windowMs }) {
    this.windowMs = windowMs;
    this.users = new Map();
  }

  record(userId, event) {
    const now = Date.now();
    let events = this.users.get(userId);
    if (!events) {
      events = [];
      this.users.set(userId, events);
    }
    events.push({ ...event, at: now });
    this.prune(events, now);
    return events;
  }

  get(userId) {
    const events = this.users.get(userId);
    if (!events) return [];
    this.prune(events, Date.now());
    return events;
  }

  clear(userId) {
    this.users.delete(userId);
  }

  prune(events, now) {
    while (events.length && now - events[0].at > this.windowMs) {
      events.shift();
    }
  }

  sweep() {
    const now = Date.now();
    for (const [userId, events] of this.users) {
      this.prune(events, now);
      if (events.length === 0) this.users.delete(userId);
    }
  }
}

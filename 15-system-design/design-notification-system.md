# Design a Notification System

> **Difficulty:** 🔴 Hard · **Est. time:** `1h` · **Tags:** `#realtime` `#websocket` `#state` `#a11y`

**Asked at:** _Meta, LinkedIn, Uber, Atlassian_ · **Related:** [Chat](design-chat-whatsapp-web.md) · [News Feed](design-news-feed.md) · [Interview Patterns](../17-interview-patterns/)

---

## 1. The Question

> Design a frontend notification system (bell icon + dropdown + toasts): real-time in-app notifications, an unread badge, a notification center with history, and transient toasts for live events.

## 2. Requirements

**Functional**
- [ ] Bell icon with an **unread count** badge.
- [ ] Dropdown/inbox listing notifications (read/unread, grouped, paginated).
- [ ] **Real-time** delivery of new notifications.
- [ ] Transient **toasts** for high-priority live events.
- [ ] Mark as read (single / all); click-through to the target.
- [ ] Preferences (mute categories) — bonus.

**Non-functional**
- [ ] New notifications appear within ~1s.
- [ ] Bounded memory; history paginates.
- [ ] Accessible: announced to screen readers, keyboard operable.
- [ ] Survives reconnects; no duplicates, no missed items.

## 3. High-Level Design

```
┌────────────────┐  WebSocket/SSE   ┌──────────┐
│ Notification    │ ◀─────────────── │ Server   │  push new events
│ Store           │  REST (history)  └──────────┘
│ - list (norm.)  │ ────────────────▶  GET /notifications?cursor
│ - unreadCount   │
└───────┬────────┘
        ├─▶ Bell + Badge (subscribes to unreadCount)
        ├─▶ Inbox dropdown (subscribes to list, paginated)
        └─▶ Toast manager (subscribes to high-priority stream)
```

- **Transport:** SSE or WebSocket for push; REST for paginated history + mark-read mutations.
- **Store:** normalized notifications keyed by id + a derived `unreadCount`.
- **Three consumers:** badge, inbox, and toast manager — all read the same store.

## 4. Deep Dives & Trade-offs

**Push transport: SSE vs WebSocket** → notifications are mostly **server→client**, so **SSE** is a great fit (simpler, auto-reconnect, works over HTTP). Use WebSocket if you already have one for chat, or need client→server on the same channel.

**Delivery guarantees** → on connect/reconnect, fetch "since last seen" so you never miss events during downtime. Dedupe by id (reconnect may replay). Keep a `lastSeenId`/cursor.

**Unread badge accuracy** → the badge is derived state (`count of unread`), not a separate counter you increment — that avoids drift. Server sends authoritative counts periodically to reconcile.

**Toasts vs inbox** → not every notification toasts (that's noisy). Only high-priority/real-time-relevant ones toast; all land in the inbox. Toast manager = a queue with max visible, auto-dismiss timers, pause-on-hover, and stacking.

**Optimistic mark-as-read** → update UI immediately, send mutation, roll back on failure. "Mark all read" is a single batched request.

**Pagination & memory** → inbox loads pages on scroll (cursor-based); old notifications aren't all held in memory.

**Accessibility** → the toast region is an `aria-live="polite"` (or `assertive` for urgent) region so screen readers announce new notifications. The bell button exposes the unread count via `aria-label` ("Notifications, 3 unread"). Inbox is keyboard-navigable; Esc closes.

**Cross-tab sync** → use `BroadcastChannel` or a `storage` event so marking read in one tab updates the badge in others.

## 5. What Interviewers Probe

- SSE vs WebSocket vs polling for notifications.
- How the unread badge stays accurate (derived, reconciled).
- Missed events on reconnect (fetch-since + dedupe).
- Toast queue management (max visible, timers, pause-on-hover).
- Optimistic mark-as-read + rollback.
- Accessibility (live regions, badge labels).
- Cross-tab consistency.

## 6. Curated Resources

- [MDN: Server-Sent Events ⭐](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events) — the push transport
- [MDN: ARIA live regions ⭐](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/ARIA_Live_Regions) — accessible toasts
- [MDN: BroadcastChannel](https://developer.mozilla.org/en-US/docs/Web/API/BroadcastChannel_API) — cross-tab sync
- [web.dev: notifications](https://web.dev/articles/push-notifications-overview) — web push (background)

## 7. Related Topics

- [Design a Chat App](design-chat-whatsapp-web.md)
- [Interview Patterns: real-time updates](../17-interview-patterns/)
- [Machine coding: Toast system](../16-machine-coding/)

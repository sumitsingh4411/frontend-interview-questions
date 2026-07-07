# Design Google Docs (Collaborative Editing)

> **Difficulty:** 🔴 Hard · **Est. time:** `1.5h` · **Tags:** `#realtime` `#crdt` `#ot` `#collaboration`

**Asked at:** _Google, Meta, Atlassian, Notion_ · **Related:** [Chat](design-chat-whatsapp-web.md) · [Interview Patterns](../17-interview-patterns/)

---

## 1. The Question

> Design the frontend for a collaborative document editor (Google Docs): multiple users edit the same document simultaneously and see each other's changes and cursors in real time.

## 2. Requirements

**Functional**
- [ ] Rich-text editing (bold, lists, headings…).
- [ ] Real-time multi-user editing with live remote cursors/selections.
- [ ] Conflict-free concurrent edits.
- [ ] Offline editing that merges on reconnect.
- [ ] Undo/redo that respects collaboration.

**Non-functional**
- [ ] Local edits feel instant (no round-trip latency).
- [ ] Convergence — everyone ends at the same document.
- [ ] Handles high edit frequency without jank.
- [ ] Accessible editing surface.

## 3. High-Level Design

```
 Local edit ─▶ apply locally (instant) ─▶ produce op/change
                     │
                     ▼
             sync engine (OT or CRDT)  ◀──WebSocket──▶  server relay
                     │                                     │
              merge remote ops ◀──────────────────────────┘
                     ▼
              re-render document + remote cursors
```

- **Editing model:** a structured document model (not raw contentEditable) — e.g. ProseMirror/Lexical/Slate — so edits are expressed as **operations**, not DOM diffs.
- **Sync engine:** **OT** (Operational Transform) or **CRDT** to merge concurrent edits.
- **Transport:** WebSocket for low-latency bidirectional op exchange.

## 4. Deep Dives & Trade-offs

**OT vs CRDT** → the core decision.
- **OT** (what Google Docs uses): transform concurrent ops against each other; needs a central server to order/transform. Compact, but complex transform functions.
- **CRDT** (Yjs/Automerge): data structures that mathematically converge without a central authority; great for offline/P2P, but larger metadata/memory.
- **Recommendation:** CRDT (via Yjs) for most modern designs — simpler correctness, first-class offline. Mention OT as the classic server-centric alternative.

**Why not send text diffs** → concurrent character-level edits at the same position conflict; you need position-stable identities (CRDTs give each character a unique id) or transformation (OT) so intent is preserved.

**Local-first latency** → apply edits locally immediately; sync in the background. The sync engine guarantees convergence, so the UI never blocks on the network.

**Remote cursors/presence** → a separate ephemeral "awareness" channel (cursor position, selection, user color) — not part of the document history.

**Undo/redo** → must be **local** (undo *your* change, not a collaborator's). CRDT/OT frameworks provide collaboration-aware undo stacks.

**Offline** → queue local ops; on reconnect the CRDT merges automatically. Persist the doc + pending ops in IndexedDB.

**Rendering** → editing large docs needs efficient re-render (only changed nodes) and possibly virtualization of off-screen content.

## 5. What Interviewers Probe

- OT vs CRDT — trade-offs, and which you'd pick and why.
- Why raw text diffs fail for concurrent edits.
- How local-first editing stays instant.
- Presence/awareness vs document data separation.
- Collaboration-aware undo/redo.
- Offline merge on reconnect.

## 6. Curated Resources

- [Yjs docs (CRDT) ⭐](https://docs.yjs.dev/) — the go-to CRDT framework
- [Google: what's different about OT](https://www.youtube.com/watch?v=Xj6dpzWEjA0) — OT explained
- [ProseMirror ⭐](https://prosemirror.net/docs/guide/) — structured rich-text model
- [Automerge](https://automerge.org/) — CRDT deep dive

## 7. Related Topics

- [Design Chat (real-time)](design-chat-whatsapp-web.md)
- [Interview Patterns: conflict resolution](../17-interview-patterns/)
- [State: offline support](../13-state-management/)

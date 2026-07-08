# 15 · Frontend System Design

The main event. "Design X" — where you drive the whole conversation: requirements → architecture → data flow → deep dives → trade-offs. Start with the ⭐ **flagships** (fully solved) to learn the shape of a great answer, then practice the rest.

> Difficulty: 🟢 Easy · 🟡 Medium · 🔴 Hard · [⬆ Back to all sections](../README.md)

### 🧠 How to approach any "Design X"
1. **Clarify requirements** (functional + non-functional) — don't skip this, it's graded.
2. **Draw the high-level architecture** — components, data flow, API.
3. **Pick a rendering strategy** and justify it.
4. **Deep-dive the hard parts** — the interviewer steers here.
5. **Call out trade-offs** proactively (perf, a11y, offline, scale).

📖 General frameworks: [GreatFrontEnd: system design guide ⭐](https://www.greatfrontend.com/front-end-system-design-playbook) · [Frontend Interview Handbook](https://www.frontendinterviewhandbook.com/) · [systemdesign.one](https://systemdesign.one/)

---

## ⭐ Flagship solutions (fully worked)

| Problem | Difficulty | Time | Tags |
|---------|:----------:|:----:|------|
| [Design a News Feed / Infinite Scroll](design-news-feed.md) | 🔴 | 1h | `#feed` `#infinite-scroll` `#virtualization` |
| [Design Autocomplete / Typeahead](design-autocomplete.md) | 🟡 | 45m | `#search` `#debounce` `#caching` |
| [Design a Chat App (WhatsApp Web)](design-chat-whatsapp-web.md) | 🔴 | 1h | `#realtime` `#websocket` `#offline` |
| [Design Google Docs (collaborative)](design-google-docs.md) | 🔴 | 1.5h | `#realtime` `#crdt` `#collaboration` |
| [Design an Image Carousel at scale](design-image-carousel.md) | 🟡 | 45m | `#media` `#a11y` `#performance` |

---

## 📰 Feeds & Social

| Problem | Difficulty | Time | Resource |
|---------|:----------:|:----:|----------|
| Design News Feed (Facebook/Twitter) | 🔴 | 1h | [Flagship ⭐](design-news-feed.md) |
| Design Instagram | 🔴 | 1h | [GreatFrontEnd](https://www.greatfrontend.com/questions/system-design) |
| Design Twitter / X | 🔴 | 1h | [GreatFrontEnd](https://www.greatfrontend.com/questions/system-design) |
| Design LinkedIn Feed | 🔴 | 1h | [Flagship pattern](design-news-feed.md) |
| Design Reddit | 🔴 | 1h | [Nested comments](../16-machine-coding/nested-comments.md) |
| Design a Stories feature | 🟡 | 45m | [GreatFrontEnd](https://www.greatfrontend.com/questions/system-design) |
| Design Live Comments | 🟡 | 45m | [Real-time pattern](../17-interview-patterns/) |
| Design a Poll / Voting widget | 🟢 | 30m | [Machine coding](../16-machine-coding/) |
| Design a Notification system | 🔴 | 1h | [Real-time pattern](../17-interview-patterns/) |
| Design an Activity Feed | 🟡 | 45m | [Flagship pattern](design-news-feed.md) |
| Design a Comment system | 🟡 | 45m | [Nested comments](../16-machine-coding/nested-comments.md) |
| Design a Follow/Friend system UI | 🟡 | 45m | [Optimistic UI](../17-interview-patterns/) |
| Design a Reactions (emoji) picker | 🟢 | 30m | [Machine coding](../16-machine-coding/) |
| Design a Hashtag/mention input | 🟡 | 45m | [Autocomplete flagship](design-autocomplete.md) |

## 💬 Communication & Real-time

| Problem | Difficulty | Time | Resource |
|---------|:----------:|:----:|----------|
| Design WhatsApp Web / Chat | 🔴 | 1h | [Flagship ⭐](design-chat-whatsapp-web.md) |
| Design Slack | 🔴 | 1.5h | [Flagship pattern](design-chat-whatsapp-web.md) |
| Design Discord | 🔴 | 1.5h | [Flagship pattern](design-chat-whatsapp-web.md) |
| Design Messenger | 🔴 | 1h | [Flagship pattern](design-chat-whatsapp-web.md) |
| Design Zoom (video call UI) | 🔴 | 1.5h | [WebRTC](https://webrtc.org/getting-started/overview) |
| Design Google Meet | 🔴 | 1.5h | [WebRTC](https://webrtc.org/) |
| Design Gmail | 🔴 | 1.5h | [GreatFrontEnd](https://www.greatfrontend.com/questions/system-design) |
| Design an Email client (Outlook) | 🔴 | 1.5h | [Virtualization](../06-react/build-a-virtualized-list.md) |
| Design a Typing indicator / presence | 🟡 | 45m | [Real-time pattern](../17-interview-patterns/) |
| Design a Video conferencing grid | 🔴 | 1h | [Performance](../09-performance/) |
| Design a Live streaming chat | 🔴 | 1h | [Real-time pattern](../17-interview-patterns/) |

## 📝 Productivity & Collaboration

| Problem | Difficulty | Time | Resource |
|---------|:----------:|:----:|----------|
| Design Google Docs | 🔴 | 1.5h | [Flagship ⭐](design-google-docs.md) |
| Design Google Sheets / Spreadsheet | 🔴 | 1.5h | [Machine coding](../16-machine-coding/) |
| Design Notion | 🔴 | 1.5h | [Flagship pattern](design-google-docs.md) |
| Design Trello / Kanban | 🔴 | 1h | [Machine coding flagship](../16-machine-coding/kanban-drag-and-drop.md) |
| Design Jira | 🔴 | 1.5h | [GreatFrontEnd](https://www.greatfrontend.com/questions/system-design) |
| Design Asana / task manager | 🔴 | 1.5h | [Kanban flagship](../16-machine-coding/kanban-drag-and-drop.md) |
| Design a Calendar (Google Calendar) | 🔴 | 1.5h | [Machine coding](../16-machine-coding/) |
| Design a Rich Text Editor | 🔴 | 1.5h | [ProseMirror](https://prosemirror.net/) |
| Design Figma / Whiteboard | 🔴 | 2h | [Canvas API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API) |
| Design Miro | 🔴 | 2h | [Canvas API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API) |
| Design a Form Builder | 🔴 | 1.5h | [Machine coding](../16-machine-coding/) |
| Design a Survey / Quiz platform | 🟡 | 1h | [State](../13-state-management/) |
| Design a Documentation platform (Docusaurus) | 🟡 | 1h | [Rendering](../01-fundamentals/) |
| Design a Code editor (VS Code Web) | 🔴 | 2h | [Monaco](https://microsoft.github.io/monaco-editor/) |

## 🖼️ Media & Streaming

| Problem | Difficulty | Time | Resource |
|---------|:----------:|:----:|----------|
| Design YouTube | 🔴 | 1.5h | [GreatFrontEnd](https://www.greatfrontend.com/questions/system-design) |
| Design Netflix | 🔴 | 1.5h | [GreatFrontEnd](https://www.greatfrontend.com/questions/system-design) |
| Design a Video Player | 🔴 | 1h | [MDN: media](https://developer.mozilla.org/en-US/docs/Web/Media) |
| Design Spotify | 🔴 | 1.5h | [GreatFrontEnd](https://www.greatfrontend.com/questions/system-design) |
| Design SoundCloud (audio) | 🟡 | 1h | [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API) |
| Design an Image Gallery / Carousel | 🟡 | 45m | [Flagship ⭐](design-image-carousel.md) |
| Design a Photo editor | 🔴 | 1.5h | [Canvas API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API) |
| Design a File Upload (chunked, resumable) | 🔴 | 1h | [Pattern](../17-interview-patterns/) |
| Design Pinterest (masonry grid) | 🔴 | 1h | [Virtualization](../06-react/build-a-virtualized-list.md) |
| Design a Podcast player | 🟡 | 1h | [Media](https://developer.mozilla.org/en-US/docs/Web/Media) |

## 🛒 Commerce & Marketplaces

| Problem | Difficulty | Time | Resource |
|---------|:----------:|:----:|----------|
| Design Amazon / E-commerce | 🔴 | 1.5h | [GreatFrontEnd](https://www.greatfrontend.com/questions/system-design) |
| Design a Product Listing + Filters | 🟡 | 1h | [Pattern](../17-interview-patterns/) |
| Design a Cart & Checkout | 🟡 | 1h | [State pattern](../13-state-management/) |
| Design Airbnb | 🔴 | 1.5h | [GreatFrontEnd](https://www.greatfrontend.com/questions/system-design) |
| Design Booking.com | 🔴 | 1.5h | [State](../13-state-management/) |
| Design a Food Delivery (Swiggy/DoorDash) | 🔴 | 1.5h | [GreatFrontEnd](https://www.greatfrontend.com/questions/system-design) |
| Design Uber / Ride-hailing | 🔴 | 1.5h | [Maps below](#-maps--data) |
| Design a Payment / Checkout form | 🟡 | 1h | [Security](../10-security/) |
| Design a Price comparison table | 🟢 | 30m | [Machine coding](../16-machine-coding/) |
| Design a Wishlist / Save-for-later | 🟢 | 30m | [Offline](../17-interview-patterns/) |
| Design a Flash-sale / countdown page | 🟡 | 45m | [Real-time pattern](../17-interview-patterns/) |

## 🗺️ Maps, Dashboards & Data

| Problem | Difficulty | Time | Resource |
|---------|:----------:|:----:|----------|
| Design Google Maps | 🔴 | 2h | [GreatFrontEnd](https://www.greatfrontend.com/questions/system-design) |
| Design an Analytics Dashboard | 🔴 | 1.5h | [D3](https://d3js.org/) |
| Design an Admin Dashboard / CRM | 🟡 | 1h | [Machine coding](../16-machine-coding/) |
| Design a Trading / Crypto Dashboard (real-time) | 🔴 | 1.5h | [Real-time pattern](../17-interview-patterns/) |
| Design a Data Grid / Table (sortable, virtual) | 🔴 | 1.5h | [Virtualization](../06-react/build-a-virtualized-list.md) |
| Design a Charting library | 🔴 | 1.5h | [Canvas/SVG](https://developer.mozilla.org/en-US/docs/Web/SVG) |
| Design a Log/metrics viewer | 🔴 | 1h | [Virtualization](../06-react/build-a-virtualized-list.md) |
| Design a Ride-tracking map (live location) | 🔴 | 1.5h | [Real-time pattern](../17-interview-patterns/) |
| Design a Weather app | 🟢 | 30m | [Fundamentals](../01-fundamentals/) |
| Design a Stock ticker | 🟡 | 45m | [Real-time pattern](../17-interview-patterns/) |

## 🧱 Core UI Systems

| Problem | Difficulty | Time | Resource |
|---------|:----------:|:----:|----------|
| Design an Autocomplete / Typeahead | 🟡 | 45m | [Flagship ⭐](design-autocomplete.md) |
| Design a Search system | 🔴 | 1h | [Flagship pattern](design-autocomplete.md) |
| Design Infinite Scroll | 🔴 | 1h | [Flagship ⭐](design-news-feed.md) |
| Design a Notification/Toast system | 🟡 | 45m | [Machine coding](../16-machine-coding/) |
| Design a Design System / Component Library | 🔴 | 1.5h | [Architecture](../08-architecture/) |
| Design an i18n / localization system | 🟡 | 1h | [FormatJS](https://formatjs.io/docs/getting-started/installation/) |
| Design a Theming / Dark-mode system | 🟡 | 45m | [CSS theming](../05-css/) |
| Design a Feature-flag / A-B testing system | 🔴 | 1h | [Architecture](../08-architecture/) |
| Design an Error/crash reporting widget | 🟡 | 45m | [Error handling](../17-interview-patterns/) |
| Design an Analytics/telemetry SDK | 🔴 | 1h | [Performance](../09-performance/) |
| Design a Cookie-consent / GDPR banner | 🟢 | 30m | [Security](../10-security/) |
| Design an Onboarding tour / coach-marks | 🟡 | 45m | [Machine coding](../16-machine-coding/) |
| Design a Multi-step wizard / form flow | 🟡 | 45m | [State machines](../17-interview-patterns/) |
| Design a Global search (⌘K palette) | 🔴 | 1h | [Command palette](../16-machine-coding/) |

**Related:** [17-interview-patterns](../17-interview-patterns/) · [16-machine-coding](../16-machine-coding/) · [09-performance](../09-performance/)

_This list grows with the community — [add a "Design X"](../CONTRIBUTING.md) or turn one into a full flagship._

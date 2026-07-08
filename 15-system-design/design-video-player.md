# Design a Video Player (Netflix/YouTube-style)

> **Difficulty:** 🔴 Hard · **Est. time:** `1h` · **Tags:** `#media` `#streaming` `#performance` `#a11y`

**Asked at:** _Netflix, YouTube/Google, Meta, Amazon_ · **Related:** [Image Carousel](design-image-carousel.md) · [News Feed](design-news-feed.md)

---

## 1. The Question

> Design a custom video player: play/pause, seek, volume, quality selection, captions, fullscreen — with adaptive streaming so quality adjusts to the network.

## 2. Requirements

**Functional**
- [ ] Controls: play/pause, seek bar w/ buffered ranges, volume, playback speed, fullscreen, PiP.
- [ ] **Adaptive bitrate** streaming (quality auto-adjusts).
- [ ] Captions/subtitles (multi-language).
- [ ] Keyboard shortcuts + full a11y.
- [ ] Thumbnails on seek hover (bonus).

**Non-functional**
- [ ] Fast start (low time-to-first-frame).
- [ ] Smooth playback; minimal rebuffering.
- [ ] Accessible (captions, keyboard, screen reader).
- [ ] Works across browsers/devices.

## 3. High-Level Design

```
┌──────────────┐   segments    ┌─────────┐
│ ABR engine   │ ◀──────────── │  CDN    │  (HLS/DASH manifests + chunks)
│ (hls.js/dash)│               └─────────┘
│  picks bitrate by bandwidth + buffer
└──────┬───────┘
       ▼ appends to
┌──────────────────────────┐
│ <video> + MediaSource     │  ← core element
│ (SourceBuffers)           │
└──────┬───────────────────┘
       ▼ state
[Controls UI]  play·seek·volume·quality·captions·fullscreen
```

- **`<video>` + Media Source Extensions (MSE):** JS feeds media segments into `SourceBuffer`s, enabling adaptive streaming (native `<video src>` can't switch bitrates mid-stream).
- **ABR engine** (hls.js / dash.js / Shaka) picks the next segment's bitrate from measured bandwidth + buffer health.
- **Controls** are a custom overlay reading player state.

## 4. Deep Dives & Trade-offs

**Progressive download vs adaptive streaming** → a single MP4 (`<video src>`) is simple but can't adapt to bandwidth and wastes data. **HLS/DASH over MSE** splits video into short segments at multiple bitrates; the player switches per-segment. This is why Netflix/YouTube use it.

**ABR algorithm** → choose bitrate from (a) throughput estimate and (b) buffer occupancy. Buffer-based (BOLA) avoids overreacting to throughput spikes. Trade-off: aggressive upshift = higher quality but more rebuffer risk.

**Buffering strategy** → keep a target buffer (e.g. 30s ahead); show buffered ranges on the seek bar (`video.buffered`). On seek, may need to fetch/append new segments.

**Controls state** → drive UI from the `<video>` element's events (`timeupdate`, `progress`, `waiting`, `ratechange`) — the element is the source of truth, not parallel React state.

**Captions** → use `<track kind="subtitles">` (WebVTT) for native rendering + accessibility, or render custom cues for styling control. Must be toggleable and language-selectable.

**Accessibility** → keyboard shortcuts (Space=play, ←/→=seek, ↑/↓=volume, F=fullscreen, C=captions); controls are real buttons with labels; captions are first-class; respect `prefers-reduced-motion` for animated UI. Seek bar is a `slider` with `aria-valuenow`.

**Performance** → lazy-init the player when in viewport; preload metadata only; abort segment fetches on unmount; free `SourceBuffer`s to avoid memory growth on long sessions.

**Thumbnails on hover** → a sprite sheet (BIF/WebVTT thumbnails) mapped to timestamps.

## 5. What Interviewers Probe

- Why MSE/HLS/DASH instead of a plain `<video src>`?
- How adaptive bitrate selection works (throughput vs buffer-based).
- Driving controls from the media element's events.
- Captions and full keyboard accessibility.
- Buffer management and seek handling.
- Memory over long playback sessions.

## 6. Curated Resources

- [MDN: Media Source Extensions ⭐](https://developer.mozilla.org/en-US/docs/Web/API/Media_Source_Extensions_API) — the core API
- [hls.js ⭐](https://github.com/video-dev/hls.js/) — reference ABR player
- [MDN: HTMLMediaElement events](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement) — driving the UI
- [MDN: WebVTT / `<track>`](https://developer.mozilla.org/en-US/docs/Web/API/WebVTT_API) — captions

## 7. Related Topics

- [Design an Image Carousel](design-image-carousel.md)
- [Performance: media & lazy loading](../09-performance/)
- [Accessibility](../11-accessibility/)

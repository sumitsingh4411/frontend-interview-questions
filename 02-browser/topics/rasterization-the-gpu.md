<div align="center">

# Rasterization & the GPU

<sub>🌐 Browser · 🔴 Hard · ⏱ 45m · `#rendering` `#gpu`</sub>

<a href="../README.md">⬅ Browser</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — Rasterization is the step that turns paint's *display list* into real pixels — done tile-by-tile, on raster worker threads, usually by the **GPU** in a separate sandboxed process — and it's the hidden cost behind "cheap" `transform` animations the moment fresh content scrolls into view.

---

## 🧠 Mental model

Paint **records** ("fill this rect grey, stroke this border, lay down these glyphs"). Rasterization **executes** that recording into an actual grid of ARGB pixels. They are two different jobs and — crucially — they run on different threads.

```
Main thread:   layout → paint (display list) → COMMIT ─┐
                                                        ▼
Compositor:    split layer into TILES ──▶ raster workers ──▶ GPU textures ──▶ draw quads
               (only tiles inside the "interest rect" near the viewport)
```

The shortcut: **a display list is a recipe; a texture is the cooked meal.** The compositor can move an already-cooked texture around for free, but the first time a region becomes visible, *someone has to cook it* — and that someone is the raster pipeline.

## ⚙️ How it actually works

**Tiling.** A layer isn't rastered as one giant bitmap. The compositor cuts it into tiles (≈256×256 or 512×512). Only tiles inside the **interest rect** — the viewport plus a margin — get rastered, so an infinitely long page never rasters all at once.

**Raster workers.** Tiles are handed to a pool of raster worker threads. Each replays the tile's slice of the display list. This is off the main thread, which is why scrolling can reveal new content while your JavaScript is busy.

**GPU rasterization.** In modern Chrome the display list is translated (via Skia) into GPU draw calls — the tiles are drawn *on the GPU* and land as textures in VRAM. Software raster (CPU fills a shared-memory bitmap, then uploads) is the fallback for unsupported content or blocklisted drivers.

**Out-of-process.** The renderer never talks to the graphics driver directly — the sandbox forbids it. Commands cross into the **GPU process** over a command buffer. A driver crash takes down the GPU process, not your tab.

**Compositing reuses the output.** Once tiles are textures, per-frame work is just sampling them with transformed *draw quads*. That's why `transform`/`opacity` are cheap — no re-raster. But scroll fast into un-rastered territory and you get **checkerboarding**: blank or low-res tiles until raster catches up.

## 💻 Code

```css
/* Raster cost scales with PIXELS and with per-pixel complexity. */

/* ❌ A large blurred shadow on a scrolling list re-rasters every frame it
   moves into view. Blur is per-pixel work — the classic raster bottleneck. */
.card { box-shadow: 0 20px 60px rgba(0,0,0,.4); }

/* ✅ Same look, far cheaper: promote once, animate transform (no re-raster). */
.card { will-change: transform; box-shadow: 0 8px 16px rgba(0,0,0,.25); }
```

```js
// Texture memory is width × height × 4 bytes — and DOUBLES per axis on HiDPI.
// A full-screen layer on a 1440×900 @2x display:
const px = 1440 * 900 * (window.devicePixelRatio ** 2); // 2x → 4× the pixels
const bytes = px * 4;                                    // ≈ 20 MB in VRAM, one layer
```

## ⚖️ Trade-offs

- **GPU raster is fast but memory-hungry.** Every tile is a texture living in VRAM. A layer explosion isn't just compositing overhead — it's raster and upload cost too.
- **More tiles = more parallelism but more bookkeeping.** The tile size is the browser's call; you influence it only indirectly, by keeping layers reasonably sized and not forcing max-texture-size splits.
- **Don't confuse "composited" with "free."** `transform` skips *layout and paint*, but freshly revealed pixels still cost raster + upload. Smooth-looking motion can still checkerboard.

## 💣 Gotchas interviewers probe

- **`transform` animations still raster new area.** People say transform is "GPU and free." It's free to *move* existing tiles; scrolling or scaling into un-rastered regions triggers raster and can checkerboard.
- **Blur, `box-shadow`, gradients, and `filter` are raster-bound**, not layout/paint-bound — they're per-pixel work executed during rasterization. Big blurs on scrollers are a top offender.
- **HiDPI quadruples raster cost.** `devicePixelRatio: 2` means 4× the pixels per CSS area — 4× the texture memory and roughly 4× the raster time.
- **Huge layers exceed the max GPU texture size** (often 4096–16384px) and must be tiled or fail — a very tall `will-change` element is a trap.
- **Rasterization lives in the GPU process, out of your control.** A driver blocklist silently downgrades you to software raster, and everything gets slower with no code change on your side.

## 🎯 Say this in the interview

> "After paint produces a display list, rasterization turns that recipe into actual pixels — tile by tile, on raster worker threads, and in modern Chrome via the GPU in a separate sandboxed process. The compositor only rasters tiles near the viewport, the interest rect, so long pages don't raster all at once. Once tiles are GPU textures, moving them with `transform` or `opacity` is just re-sampling with draw quads — that's why those animate cheaply. The nuance I'd flag: 'composited' doesn't mean 'free.' Scrolling into un-rastered area still costs raster and can checkerboard, per-pixel effects like blur and shadow are raster-bound, and on a 2× display every layer is four times the pixels and VRAM. So I keep layers sized sensibly and reach for `transform`/`opacity`, not `left`/`box-shadow` animation."

## 🔗 Go deeper

- [web.dev — Animations guide](https://web.dev/articles/animations-guide) — which properties avoid raster and paint, and why that keeps frames on budget.
- [Inside look at modern web browser (part 3)](https://developer.chrome.com/blog/inside-browser-part3) — tiling, raster, and the GPU process from Chrome's own team.
- [web.dev — Rendering performance](https://web.dev/articles/rendering-performance) — where raster sits in the pixel pipeline and how to cut its per-pixel cost.

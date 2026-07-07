# DupScreen

**See two versions of your app side by side — pixel for pixel, style for style, API for API.**

DupScreen is a Chrome extension built for the moment you need to prove that "the new version looks and behaves exactly like the old one." Drop in two URLs — a React build and an Angular build, prod and staging, before and after — and DupScreen loads them together at **true desktop width**, then hands you a full toolbox to blend, inspect, diff, and stress-test both pages without ever leaving the tab.

No more squinting at two half-width windows. No more "works on my machine." Just fast, visual, side-by-side truth.

---

## Why you'll want it

- **Real desktop layouts, not squished ones.** Chrome's native split view shrinks each pane and triggers tablet/mobile breakpoints. DupScreen renders each page at a full desktop viewport (1920px by default) using CSS zoom — so both pages show their real desktop layout even in a narrow space.
- **Everything in one screen.** Visual blending, CSS diffing, typography auditing, network comparison, and API testing all live in a single overlay tab.
- **Made for parity work.** Migrating frameworks, redesigning a UI, or verifying a release? DupScreen is designed to catch the differences humans miss.
- **Zero setup.** Load unpacked, click the icon, paste two URLs, go.

---

## What it can do

### Compare visually, three ways

Layer both pages on top of each other and switch instantly between comparison modes:

- **Opacity Blend** — drag a slider to fade smoothly between Page A and Page B and spot every pixel that shifts.
- **Swipe Divider** — drag a vertical line across the screen for a crisp before/after reveal.
- **Side by Side** — view both pages next to each other, auto-scaled to fit, for an at-a-glance diff.

### Render at any viewport

- Desktop presets: **1920 / 1440 / 1366px**
- Tablet presets: **iPad Landscape, iPad Air/Pro, iPad 10th, iPad Mini, Android Tablet**
- **Custom width** from 320px to 3840px — test any breakpoint without resizing your browser.
- **Visual zoom** from 25% to 300% to inspect fine detail or get the bird's-eye view.

### Keep both pages in lockstep

- **Synchronized scrolling** — scroll one page and the other follows proportionally, so long pages stay aligned.
- **Mirror Interact** — pick a matching element in each frame and your clicks and keystrokes drive **both** pages at once. Fill a form once, watch two apps respond.

### Inspect and diff the styling

- **CSS Inspector** — hover any element to see its computed styles grouped by category (Box Model, Typography, Background, Layout, Visual). Shift+click to pin, drag, and scroll the panel.
- **CSS Compare** — click an element in A and its counterpart in B to get a full side-by-side property table with every difference highlighted. Flip on **"Only differences"** to cut straight to what changed.
- **Typography Compare** — scan every piece of text on both pages and audit fonts, sizes, and weights in one table. Filter to mismatches only, then copy the report.

### Compare the network layer

- **Network Capture** — record REST calls from both frames, grouped by endpoint, with live filtering and export/import so you can compare request payloads and response bodies between the two apps.
- **Record & Mock** — capture API responses from one frame and serve them as mocks to the other. Endpoints without a recorded response fall through to the real server, and you can swap the record/mock direction with one click.
- **Response Overrides** — edit any captured response (status code + JSON body) and apply it as a live override to reproduce edge cases on demand.

### Test APIs in bulk

**API Bulk Testing** turns your captured endpoints into a mini test runner: select the APIs you care about, substitute lists of **PTN/MDN, Subscriber, and BAN / Customer ID** values, flag blocked keywords, and fire off runs across every combination. Watch live progress, review a pass/fail results table, and edit-and-replay any single request payload.

### Capture, annotate, and share

- **Full-page screenshot** — stitch both pages into a single high-res side-by-side PNG. DupScreen scrolls each page in chunks, hides sticky headers to avoid duplication, and composites the result automatically.
- **Draw** — sketch annotations directly over the comparison with adjustable pen color and thickness to mark up the differences you find.
- **Pop Out** — launch either page into its own tab with its authenticated session intact.

### A built-in dev toolbox

Right from the popup you also get everyday QA helpers:

- **Environment presets** — quick-fill URLs for your UAT, dev, and local environments, with automatic React/Angular URL matching based on your alias.
- **Swap & refresh** A/B, custom aliases, and one-click loading.
- **IMEI Generator** — valid random IMEIs (RBI prefix + Luhn checksum), one-click copy.
- **Test Credit Cards** — pull PayPal sandbox test cards on demand and copy the number.
- **Auto update check** — the popup tells you when a newer version is available.

---

## Installation

1. Open Chrome and go to `chrome://extensions/`
2. Enable **Developer mode** (top-right toggle)
3. Click **Load unpacked**
4. Select the `dupscreen-chrome-plugin` folder
5. The DupScreen icon appears in your toolbar

## Quick start

1. Click the **DupScreen** icon.
2. Give Page A and Page B a label (e.g. *React* / *Angular*), pick an environment or paste two URLs.
3. Click **Open Screen Compare**.
4. Switch modes, dial in a viewport width, and reach for whichever tool you need — Inspect, Compare, Typography, Network, Record & Mock, Bulk Test, Mirror, Draw, or Screenshot.

### Overlay controls at a glance

| Control | What it does |
|---------|--------------|
| Opacity / Swipe / Side by Side | Switch comparison mode |
| A/B slider | Blend pages (opacity) or move the divider (swipe) |
| Inspect | Hover to read computed CSS; Shift+click to pin |
| Compare | Diff CSS between an element in A and B |
| Typography | Audit fonts, sizes, and weights across both pages |
| Network | Capture and compare REST calls, grouped by endpoint |
| Record → Mock | Record responses from one frame, mock them on the other |
| Bulk Test | Run captured APIs across lists of test data |
| Mirror | Drive matching elements in both frames at once |
| Sync Scroll | Lock scroll positions between frames |
| Draw | Annotate over the comparison |
| Screenshot | Full-page side-by-side PNG |
| Pop A / Pop B | Open a page in its own tab (session preserved) |
| Viewport / Custom width | Simulate desktop and tablet widths |
| Zoom +/- | Visual zoom (25%–300%) |
| Interact A/B | Choose which frame receives input |

---

## File structure

```
dupscreen-chrome-plugin/
  manifest.json          Chrome extension manifest (Manifest V3)
  background.js          Service worker: window/tab management, header stripping,
                         script injection, scroll sync, network capture, mock/override,
                         bulk API runner, inspector/compare handlers
  content.js             Content script: CSS zoom and scroll reporting
  popup.html/js/css      Popup UI: Screen Compare launcher + dev toolbox
  overlay.html/js/css    Overlay compare page with all comparison tools
  network.html/js/css    Standalone network monitor view
  network-interceptor.js Injected fetch/XHR interceptor for capture, mock, and override
  icons/                 Extension icons (16, 48, 128px)
```

## Technical notes

- **Full desktop rendering:** CSS zoom makes the browser report a larger `window.innerWidth`, so media queries resolve at desktop breakpoints while the content is visually scaled to fit the pane.
- **Cross-origin embedding:** DupScreen uses `declarativeNetRequest` session rules to strip `X-Frame-Options` and `Content-Security-Policy` headers for the overlay tab so both pages can load in iframes. Some sites may still block embedding — use **Pop Out** for those.
- **Network capture & mocking:** an injected interceptor wraps `fetch` and `XMLHttpRequest` to record requests/responses, replay recorded mocks, and apply live overrides.
- **Screenshot stitching:** full-page captures scroll each page in viewport-height chunks, capture each chunk, hide fixed/sticky elements after the first chunk to prevent repetition, and composite onto a canvas.
- **Session preservation:** Pop Out uses `window.open()` from within the iframe context so the new tab inherits the page's session cookies.

## Permissions

| Permission | Why it's needed |
|------------|-----------------|
| `activeTab` | Access the current tab to launch comparisons |
| `scripting` | Inject zoom, inspector, compare, and network scripts into frames |
| `tabs` | Create and manage the overlay and pop-out tabs |
| `storage` | Persist viewport and tool preferences |
| `system.display` | Read screen dimensions for sizing |
| `declarativeNetRequest` | Strip iframe-blocking headers for overlay mode |
| `webNavigation` | Target script injection to the right iframes |
| `debugger` | Capture full-page screenshots and network details |
| `clipboardWrite` | Copy generated IMEIs and test card numbers |
| `<all_urls>` | Apply DupScreen's tools to any website |

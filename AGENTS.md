# Server version

This copy powers the full Sites deployment. The user explicitly requested direct OpenAI integration here; keep GitHub Pages main unchanged. API credentials stay in OPENAI_API_KEY server secrets, never browser assets. Do not rewrite published Git history. Never edit generated files by hand.

## Project rules

- Alert rules (levels, thresholds, 4 s reading time, anti-false-alarm confirmation) live as pure functions in `src/lib/alerts.ts` with tests in `src/test/alerts.test.ts` — keeps safety logic testable and separate from UI.
- Station state lives in `src/lib/station-store.ts` (browser store, localStorage, simulator as data source) — swap `simulateReading` for real Arduino data when the station is connected.
- AI assistant streams through `/api/chat` (server route) with direct OpenAI Responses helpers in `src/lib/ai/`; conversations are threads at `/assistente/$threadId` saved in localStorage — keeps the API key server-side.
- Live weather comes from the shared, keyless `src/lib/weather.ts`. Server consumers re-export it through `weather.server.ts`; GitHub Pages calls it directly from the browser. Keep both hosting targets working; never expose OPENAI_API_KEY in Pages assets.
- The Brazil map is a pre-simplified SVG (`src/lib/brazil-map.ts`, generated with its own `project()`); no tile provider or map SDK — avoids keys and SSR issues.
- Site language (pt/en/es) is a small browser store + dictionary in `src/lib/i18n.ts` (`useT`); the chosen language is also sent to the assistant — no i18n library needed for a small site.
- Libras uses the official VLibras widget loaded client-side by `src/components/vlibras-widget.tsx` in the root layout — free government tool, no key.
- Voice assistant (`/voz`) uses GPT Live via the persistent WebSocket relay `src/lib/live-relay.server.ts` (dispatched from `src/server.ts`, dev via `live-vite-plugin.ts`) with the `useLiveVoice` hook — WebRTC carries media directly to OpenAI; the backend sideband handles delegation and never exposes the key.

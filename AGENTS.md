<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Project rules
- Alert rules (levels, thresholds, 4 s reading time, anti-false-alarm confirmation) live as pure functions in `src/lib/alerts.ts` with tests in `src/test/alerts.test.ts` — keeps safety logic testable and separate from UI.
- Station state lives in `src/lib/station-store.ts` (browser store, localStorage, simulator as data source) — swap `simulateReading` for real Arduino data when the station is connected.
- AI assistant streams through `/api/chat` (server route) with Lovable AI Gateway Responses helpers in `src/lib/ai/`; conversations are threads at `/assistente/$threadId` saved in localStorage — keeps the API key server-side.
- Live weather for other Brazilian cities comes from Open-Meteo (free, no key) via `src/lib/weather.server.ts`, used by the `/brasil` map server function and the assistant's `consultar_tempo` tool — one source, no secrets.
- The Brazil map is a pre-simplified SVG (`src/lib/brazil-map.ts`, generated with its own `project()`); no tile provider or map SDK — avoids keys and SSR issues.
- Site language (pt/en/es) is a small browser store + dictionary in `src/lib/i18n.ts` (`useT`); the chosen language is also sent to the assistant — no i18n library needed for a small site.
- Libras uses the official VLibras widget loaded client-side by `src/components/vlibras-widget.tsx` in the root layout — free government tool, no key.
- Voice assistant (`/voz`) uses GPT Live via the persistent WebSocket relay `src/lib/live-relay.server.ts` (dispatched from `src/server.ts`, dev via `live-vite-plugin.ts`) with the `useLiveVoice` hook — audio never passes through the app server and the key stays server-side.

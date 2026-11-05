// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { liveVoiceDev } from "./live-vite-plugin";

const githubPages = process.env["CIVIALERTA_GITHUB_PAGES"] === "true";

export default defineConfig({
  nitro: githubPages ? false : true,
  tanstackStart: {
    ...(githubPages ? { spa: { enabled: true } } : {}),
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: {
    base: githubPages ? "/civialerta/" : "/",
    define: { "import.meta.env.VITE_STATIC_HOST": JSON.stringify(githubPages ? "true" : "false") },
    plugins: [liveVoiceDev()],
  },
});

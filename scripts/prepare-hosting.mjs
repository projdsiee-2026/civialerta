import { cp, mkdir, readFile, writeFile } from "node:fs/promises";

// Preserve Nitro's Cloudflare Worker and adapt its output to Sites' layout.
const hosting = JSON.parse(await readFile(".openai/hosting.json", "utf8"));
if (!hosting.project_id) throw new Error("Missing hosting project_id");
await mkdir("dist/server", { recursive: true });
await mkdir("dist/client", { recursive: true });
await cp(".output/server", "dist/server", { recursive: true });
await cp(".output/public", "dist/client", { recursive: true });
await mkdir("dist/.openai", { recursive: true });
await writeFile("dist/.openai/hosting.json", `${JSON.stringify(hosting, null, 2)}\n`);
await writeFile("dist/server/index.js", 'export { default } from "./index.mjs";\n');
console.log("Hosting artifact ready: dist/server/index.js + dist/client");

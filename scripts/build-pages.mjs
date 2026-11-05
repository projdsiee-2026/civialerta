import { execFileSync } from "node:child_process";
import { cp, mkdir, readFile, writeFile } from "node:fs/promises";

execFileSync(process.execPath, ["node_modules/vite/bin/vite.js", "build"], {
  stdio: "inherit",
  env: { ...process.env, CIVIALERTA_GITHUB_PAGES: "true" },
});
await mkdir(".pages", { recursive: true });
await cp("dist/client", ".pages", { recursive: true });
const shell = await readFile("dist/client/_shell.html", "utf8");
if (!shell.includes("/civialerta/assets/")) throw new Error("Pages asset base is missing");
for (const file of ["index.html", "404.html"]) await writeFile(`.pages/${file}`, shell);
for (const route of ["brasil", "historico", "admin", "assistente", "voz"]) {
  await mkdir(`.pages/${route}`, { recursive: true });
  await writeFile(`.pages/${route}/index.html`, shell);
}
await writeFile(".pages/.nojekyll", "");
console.log("GitHub Pages pronto em .pages/");

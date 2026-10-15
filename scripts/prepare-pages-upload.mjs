import fs from "node:fs";
import path from "node:path";
import blake3 from "/home/ubuntu/.local/share/pnpm/store/v11/links/@/blake3-wasm/2.1.5/f799b4b5d22af600deaf6a7d25f03de63b4554f2ade26f46121512e56404c7b0/node_modules/blake3-wasm/dist/index.js";

const files = ["index.html", "_worker.js", "sasaki-logo.png", "assets/index-Cu-7xZan.js", "assets/index-IdrXGWRV.css"];
const types = { html: "text/html", js: "application/javascript", css: "text/css", png: "image/png" };
const out = [];
for (const rel of files) {
  const data = fs.readFileSync(path.join("client/dist", rel));
  const ext = path.extname(rel).slice(1);
  const hash = blake3.hash(Buffer.from(data.toString("base64") + ext)).toString("hex").slice(0, 32);
  out.push({ key: hash, value: data.toString("base64"), metadata: { contentType: types[ext] }, base64: true });
}
fs.writeFileSync("/tmp/pages-upload.json", JSON.stringify(out));
fs.writeFileSync("/tmp/pages-hashes.json", JSON.stringify(out.map((x) => x.key)));
console.log(out.map((x) => `${x.key} ${x.value.length}`).join("\n"));

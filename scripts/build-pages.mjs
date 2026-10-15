import { cp, mkdir, rm } from "node:fs/promises";
import { resolve } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const exec = promisify(execFile);
const root = resolve(import.meta.dirname, "..");
const config = resolve(root, "vite.preview.config.ts");
const output = resolve(root, "client", "dist");
await rm(output, { recursive: true, force: true });
await exec("pnpm", ["exec", "vite", "build", "--config", config], { cwd: root });
await mkdir(output, { recursive: true });
await cp(resolve(root, "worker.js"), resolve(output, "_worker.js"));
console.log(`Pages output ready: ${output}`);
console.log("Worker entry copied from worker.js to client/dist/_worker.js");

import dns from "node:dns";
import { existsSync, readFileSync } from "node:fs";
import { mkdir, rename, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import openapiTS, { astToString } from "openapi-typescript";

dns.setDefaultResultOrder("ipv4first");

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outPath = path.join(root, "types", "generated", "api.d.ts");
const tmpPath = `${outPath}.tmp`;

function stripSlash(value) {
  return value.replace(/\/+$/, "");
}

function parseEnvFile(filePath) {
  if (!existsSync(filePath)) {
    return {};
  }
  const text = readFileSync(filePath, "utf8");
  /** @type {Record<string, string>} */
  const out = {};
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }
    const eq = trimmed.indexOf("=");
    if (eq === -1) {
      continue;
    }
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

function resolveOrigin() {
  const fromEnv = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (fromEnv) {
    return stripSlash(fromEnv);
  }
  for (const name of [".env.local", ".env", ".env.example"]) {
    const parsed = parseEnvFile(path.join(root, name));
    const value = parsed.NEXT_PUBLIC_API_URL?.trim();
    if (value) {
      return stripSlash(value);
    }
  }
  return null;
}

async function main() {
  const origin = resolveOrigin();
  const openapiUrl = origin ? `${origin}/openapi.json` : "(no origin)";
  if (!origin) {
    console.error(
      `start the backend first: NEXT_PUBLIC_API_URL is missing (tried env, .env.local, .env, .env.example). URL tried: ${openapiUrl}`,
    );
    process.exit(1);
  }

  let specText;
  try {
    const res = await fetch(openapiUrl, {
      headers: { accept: "application/json" },
      signal: AbortSignal.timeout(20_000),
    });
    if (!res.ok) {
      console.error(
        `start the backend first: GET ${openapiUrl} returned HTTP ${res.status}`,
      );
      process.exit(1);
    }
    specText = await res.text();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`start the backend first: failed to GET ${openapiUrl} (${message})`);
    process.exit(1);
  }

  let spec;
  try {
    spec = JSON.parse(specText);
  } catch {
    console.error(`start the backend first: ${openapiUrl} was not valid JSON`);
    process.exit(1);
  }

  let contents;
  try {
    const ast = await openapiTS(spec);
    contents = astToString(ast);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`start the backend first: openapi-typescript failed (${message})`);
    process.exit(1);
  }

  if (!contents.trim()) {
    console.error(`start the backend first: generated types were empty from ${openapiUrl}`);
    process.exit(1);
  }

  await mkdir(path.dirname(outPath), { recursive: true });
  await writeFile(tmpPath, contents, "utf8");
  try {
    await rename(tmpPath, outPath);
  } catch {
    await unlink(outPath).catch(() => undefined);
    await rename(tmpPath, outPath);
  }
  console.log(`Wrote ${path.relative(root, outPath)} from ${openapiUrl}`);
}

main();

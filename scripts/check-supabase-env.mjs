#!/usr/bin/env node
/**
 * 检查 Supabase 环境变量是否已配置
 * 使用方式: node scripts/check-supabase-env.mjs 或 npm run check:env
 */
import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const envPath = resolve(root, ".env.local");

const required = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
];

function parseEnv(content) {
  const out = {};
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

function main() {
  if (!existsSync(envPath)) {
    console.error("❌ 未找到 .env.local，请创建并填写 Supabase 环境变量。");
    process.exit(1);
  }
  const content = readFileSync(envPath, "utf8");
  const env = parseEnv(content);
  const missing = required.filter((k) => !env[k] || !String(env[k]).trim());
  if (missing.length) {
    console.error("❌ .env.local 中缺少或为空:", missing.join(", "));
    process.exit(1);
  }
  console.log("✅ Supabase 环境变量已配置:", required.join(", "));
}

main();

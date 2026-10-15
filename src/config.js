import "dotenv/config";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

function loadJson(name, fallback) {
  try {
    return JSON.parse(readFileSync(join(root, name), "utf8"));
  } catch (err) {
    if (fallback !== undefined) return fallback;
    throw new Error(`อ่านไฟล์ ${name} ไม่สำเร็จ: ${err.message}`);
  }
}

const fileConfig = loadJson("config.json", {});

export const token = process.env.DISCORD_TOKEN?.trim();

export const config = {
  windowMs: fileConfig.windowMs ?? 30000,
  timeoutMs: fileConfig.timeoutMs ?? 600000,
  punishCooldownMs: fileConfig.punishCooldownMs ?? 60000,
  deleteMessages: fileConfig.deleteMessages ?? true,
  maxAttachmentBytes: fileConfig.maxAttachmentBytes ?? 8 * 1024 * 1024,
  ignoreBots: fileConfig.ignoreBots ?? true,
  ignoreUsers: new Set(fileConfig.ignoreUsers ?? []),
  ignoreRoles: new Set(fileConfig.ignoreRoles ?? []),
  ignoreChannels: new Set(fileConfig.ignoreChannels ?? []),
  notifyChannelId: fileConfig.notifyChannelId || null,
  thresholds: {
    duplicateMedia: fileConfig.thresholds?.duplicateMedia ?? 3,
    mediaChannels: fileConfig.thresholds?.mediaChannels ?? 4,
    links: fileConfig.thresholds?.links ?? 4,
    linkChannels: fileConfig.thresholds?.linkChannels ?? 3,
  },
};

export function assertConfig() {
  if (!token) {
    throw new Error(
      "ไม่พบ DISCORD_TOKEN กรุณาคัดลอก .env.example เป็น .env แล้วใส่โทเคนบอท"
    );
  }
}

export function shouldIgnore(message) {
  if (config.ignoreBots && message.author.bot) return true;
  if (config.ignoreUsers.has(message.author.id)) return true;
  if (config.ignoreChannels.has(message.channelId)) return true;
  if (message.member) {
    for (const roleId of config.ignoreRoles) {
      if (message.member.roles.cache.has(roleId)) return true;
    }
  }
  return false;
}

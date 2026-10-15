import {
  Client,
  GatewayIntentBits,
  Events,
  EmbedBuilder,
  PermissionFlagsBits,
} from "discord.js";
import { config, token, assertConfig, shouldIgnore } from "./config.js";
import { hashAttachment } from "./hash.js";
import { SpamTracker } from "./tracker.js";
import { evaluate } from "./detector.js";

const URL_REGEX = /https?:\/\/[^\s<>()]+/gi;
const MAX_ATTACHMENTS_PER_MESSAGE = 5;

assertConfig();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const tracker = new SpamTracker({ windowMs: config.windowMs });
const cooldowns = new Map();

setInterval(() => tracker.sweep(), Math.max(config.windowMs, 10000)).unref();

client.once(Events.ClientReady, (c) => {
  console.log(`[ready] เข้าสู่ระบบเป็น ${c.user.tag}`);
  console.log(
    `[config] window=${config.windowMs}ms timeout=${config.timeoutMs}ms ` +
      `dupMedia=${config.thresholds.duplicateMedia} mediaChannels=${config.thresholds.mediaChannels} ` +
      `links=${config.thresholds.links} linkChannels=${config.thresholds.linkChannels}`
  );
});

client.on(Events.MessageCreate, async (message) => {
  try {
    if (!message.inGuild()) return;
    if (shouldIgnore(message)) return;
    if (!message.member) return;

    const events = await collectEvents(message);
    if (events.length === 0) return;

    for (const event of events) {
      tracker.record(message.author.id, event);
    }

    const allEvents = tracker.get(message.author.id);
    const detection = evaluate(allEvents, config.thresholds);
    if (!detection) return;

    const last = cooldowns.get(message.author.id) ?? 0;
    if (Date.now() - last < config.punishCooldownMs) return;

    await punish(message, detection);
  } catch (err) {
    console.error("[messageCreate] ผิดพลาด:", err);
  }
});

async function collectEvents(message) {
  const events = [];

  const links = message.content.match(URL_REGEX);
  if (links) {
    for (const url of links) {
      events.push({ type: "link", url, channelId: message.channelId });
    }
  }

  const attachments = [...message.attachments.values()].slice(
    0,
    MAX_ATTACHMENTS_PER_MESSAGE
  );
  for (const attachment of attachments) {
    const result = await hashAttachment(attachment, config.maxAttachmentBytes);
    if (!result) continue;
    events.push({
      type: "media",
      hash: result.hash,
      isImage: result.isImage,
      channelId: message.channelId,
    });
  }

  return events;
}

async function punish(message, detection) {
  const member = message.member;
  const me = message.guild.members.me;

  cooldowns.set(message.author.id, Date.now());

  if (config.deleteMessages) {
    await message.delete().catch(() => {});
  }

  let timedOut = false;
  try {
    if (me && member.manageable && me.permissions.has(PermissionFlagsBits.ModerateMembers)) {
      await member.timeout(config.timeoutMs, detection.reason);
      timedOut = true;
    }
  } catch (err) {
    console.error("[punish] timeout ไม่สำเร็จ:", err);
  }

  tracker.clear(message.author.id);
  console.log(
    `[detect] ${message.author.tag} (${message.author.id}) -> ${detection.kind}: ${detection.reason} (timeout=${timedOut})`
  );

  await notify(message, detection, timedOut);
}

async function notify(message, detection, timedOut) {
  if (!config.notifyChannelId) return;
  const channel = await message.guild.channels
    .fetch(config.notifyChannelId)
    .catch(() => null);
  if (!channel || !channel.isTextBased()) return;

  const minutes = Math.round(config.timeoutMs / 60000);
  const embed = new EmbedBuilder()
    .setTitle("🚨 ตรวจพบพฤติกรรมสแปม/มิจฉาชีพ")
    .setColor(0xed4245)
    .setDescription(detection.reason)
    .addFields(
      { name: "ผู้ใช้", value: `<@${message.author.id}> (${message.author.tag})`, inline: true },
      { name: "ช่อง", value: `<#${message.channelId}>`, inline: true },
      { name: "ประเภท", value: detection.kind, inline: true },
      {
        name: "การจัดการ",
        value: timedOut ? `Timeout ${minutes} นาที` : "Timeout ไม่สำเร็จ (เช็คสิทธิ์/ลำดับยศบอท)",
        inline: false,
      }
    )
    .setTimestamp();

  await channel.send({ embeds: [embed] }).catch(() => {});
}

client.on(Events.Error, (err) => console.error("[discord] error:", err));

process.on("unhandledRejection", (err) => console.error("[unhandledRejection]", err));

client.login(token);

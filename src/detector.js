export function evaluate(events, thresholds) {
  const media = events.filter((e) => e.type === "media");
  const links = events.filter((e) => e.type === "link");

  const hashCounts = new Map();
  for (const e of media) {
    if (!e.hash) continue;
    hashCounts.set(e.hash, (hashCounts.get(e.hash) ?? 0) + 1);
  }
  for (const [, count] of hashCounts) {
    if (count >= thresholds.duplicateMedia) {
      return {
        reason: `ส่งไฟล์/รูปเดิมซ้ำ ${count} ครั้งใน ${Math.round(
          (events.at(-1).at - events[0].at) / 1000
        )}s`,
        kind: "duplicate_media",
      };
    }
  }

  const mediaChannels = new Set(media.map((e) => e.channelId));
  if (mediaChannels.size >= thresholds.mediaChannels) {
    return {
      reason: `ส่งรูป/ไฟล์กระจาย ${mediaChannels.size} ช่องข้อความ`,
      kind: "media_channels",
    };
  }

  const linkChannels = new Set(links.map((e) => e.channelId));
  if (links.length >= thresholds.links) {
    return {
      reason: `ส่งลิงก์สแปม ${links.length} ครั้ง`,
      kind: "link_spam",
    };
  }
  if (linkChannels.size >= thresholds.linkChannels) {
    return {
      reason: `ส่งลิงก์กระจาย ${linkChannels.size} ช่องข้อความ`,
      kind: "link_channels",
    };
  }

  return null;
}

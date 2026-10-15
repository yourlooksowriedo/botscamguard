import { createHash } from "node:crypto";

const imageType = (type = "") => type.startsWith("image/");

export async function hashAttachment(attachment, maxBytes) {
  if (!attachment.url) return null;
  if (typeof attachment.size === "number" && attachment.size > maxBytes) {
    return null;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);
  try {
    const res = await fetch(attachment.url, { signal: controller.signal });
    if (!res.ok) return null;

    const buffer = Buffer.from(await res.arrayBuffer());
    if (buffer.byteLength > maxBytes) return null;

    return {
      hash: createHash("sha256").update(buffer).digest("hex"),
      isImage: imageType(attachment.contentType),
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

# Discord Scam Guard 🛡️

บอทดิสคอร์ดสำหรับตรวจจับบัญชีที่ถูกแฮ็ก / มิจฉาชีพ ที่สแปมส่ง **รูป/ไฟล์เดิมซ้ำ**,
**ส่งรูปกระจายหลายช่องข้อความ**, หรือ **สแปมลิงก์** แล้วทำการ **timeout (mute) อัตโนมัติ**

> Discord bot that detects hacked accounts / scammers spamming **duplicate media**,
> **cross-channel image spam**, or **link spam**, and automatically **times out** the offender.

---

## 🇹🇭 ภาษาไทย

### คุณสมบัติ

- **ตรวจจับไฟล์/รูปซ้ำ** — คำนวณ SHA-256 ของไฟล์แนบ แล้วนับจำนวนครั้งที่ส่งไฟล์เดิมในหน้าต่างเวลา (`duplicateMedia`)
- **ส่งรูปกระจายหลายช่อง** — นับจำนวนช่องข้อความที่ไม่ซ้ำกันภายในหน้าต่างเวลา (`mediaChannels`)
- **สแปมลิงก์** — นับจำนวนลิงก์และจำนวนช่องที่ส่งลิงก์ (`links` / `linkChannels`)
- **Timeout อัตโนมัติ** — mute ผู้กระทำความผิดตามเวลาที่กำหนด
- **แจ้งเตือนแอดมิน** — ส่ง Embed ไปยังช่องที่กำหนดเมื่อตรวจพบ
- **Whitelist** — ยกเว้นบอท/ผู้ใช้/ยศ/ช่องที่ต้องการ
- **Cooldown** — กันการ timeout ซ้ำรัวๆ

### ความต้องการของระบบ

- [Node.js](https://nodejs.org/) **v18 ขึ้นไป**
- โทเคนบอทดิสคอร์ด
- สิทธิ์บอท: `Manage Messages`, `Moderate Members`, `View Channels`, `Send Messages`

### วิธีติดตั้ง

```bash
# 1. ติดตั้ง dependencies
npm install

# 2. สร้างไฟล์ .env แล้วใส่โทเคนบอท
copy .env.example .env      # Windows
# หรือ  cp .env.example .env   # macOS / Linux

# 3. รันบอท
npm start
```

### การตั้งค่าบอทบน Discord Developer Portal

1. ไปที่ https://discord.com/developers/applications แล้วสร้าง Application + Bot
2. เปิด **Privileged Gateway Intents** → เปิด `MESSAGE CONTENT INTENT`
3. เชิญบอทเข้าเซิร์ฟเวอร์พร้อมสิทธิ์: `Manage Messages`, `Moderate Members`,
   `View Channels`, `Send Messages`
4. **สำคัญ:** ลากยศของบอทให้อยู่ **สูงกว่า** ยศของผู้ใช้ทั่วไป ไม่งั้นจะ timeout ไม่ได้

### ไฟล์ `.env`

| ตัวแปร | คำอธิบาย |
| --- | --- |
| `DISCORD_TOKEN` | โทเคนบอทดิสคอร์ด (จำเป็น) |

### การตั้งค่า `config.json`

| คีย์ | ค่าเริ่มต้น | คำอธิบาย |
| --- | --- | --- |
| `windowMs` | `30000` | ช่วงเวลาที่ใช้นับเหตุการณ์ (มิลลิวินาที) |
| `timeoutMs` | `600000` | ระยะเวลา mute (มิลลิวินาที) เช่น 600000 = 10 นาที |
| `punishCooldownMs` | `60000` | ระยะกันสแปม timeout ซ้ำต่อผู้ใช้ 1 คน |
| `deleteMessages` | `true` | ลบข้อความที่ตรวจพบ |
| `maxAttachmentBytes` | `8388608` | ขนาดไฟล์สูงสุดที่จะดาวน์โหลดมาคำนวณ hash (ไบต์) |
| `ignoreBots` | `true` | ไม่ตรวจข้อความจากบอท |
| `ignoreUsers` | `[]` | รายชื่อ ID ผู้ใช้ที่ยกเว้น |
| `ignoreRoles` | `[]` | รายชื่อ ID ยศที่ยกเว้น |
| `ignoreChannels` | `[]` | รายชื่อ ID ช่องที่ยกเว้น |
| `notifyChannelId` | `""` | ID ช่องสำหรับแจ้งเตือนแอดมิน (เว้นว่าง = ปิด) |
| `thresholds.duplicateMedia` | `3` | ส่งไฟล์เดิมซ้ำกี่ครั้งจึงถือว่าสแปม |
| `thresholds.mediaChannels` | `4` | ส่งรูป/ไฟล์กระจายกี่ช่องจึงถือว่าสแปม |
| `thresholds.links` | `4` | ส่งลิงก์กี่ครั้งจึงถือว่าสแปม |
| `thresholds.linkChannels` | `3` | ส่งลิงก์กระจายกี่ช่องจึงถือว่าสแปม |

### วิธีทำงาน

1. รับ event `messageCreate`
2. ข้ามบอท/ผู้ใช้/ยศ/ช่องที่อยู่ใน whitelist
3. เก็บเหตุการณ์: คำนวณ hash ของไฟล์แนบ + หาลิงก์ในข้อความ
4. บันทึกลง sliding window ต่อผู้ใช้ (`windowMs`)
5. ประเมินกติกาใน `src/detector.js`
6. ถ้าตรวจพบ → ลบข้อความ (ถ้าเปิด), `member.timeout()`, แจ้งเตือน, และเคลียร์ประวัติผู้ใช้

### โครงสร้างโปรเจกต์

```
bot/
├── src/
│   ├── index.js      # จุดเริ่มต้น, ต่อ Discord, จัดการ timeout + แจ้งเตือน
│   ├── config.js     # โหลด config, ตรวจโทเคน, whitelist
│   ├── hash.js       # คำนวณ SHA-256 ของไฟล์แนบ (จำกัดขนาด)
│   ├── tracker.js    # sliding window นับเหตุการณ์ต่อผู้ใช้
│   └── detector.js   # กติกาตรวจสอบการสแปม
├── config.json       # ค่าตั้งค่าของบอท
├── .env.example      # ตัวอย่างตัวแปรสภาพแวดล้อม
└── package.json
```

### ข้อจำกัด / หมายเหตุ

- เป็นการตรวจจับจาก**พฤติกรรม** (ความถี่/ความซ้ำ) ไม่ใช่การสแกนเนื้อหา จึงอาจมี false positive ได้ — ปรับ threshold ให้เหมาะกับเซิร์ฟเวอร์
- การดาวน์โหลดไฟล์มาคำนวณ hash ใช้แบนด์วิดท์ จำกัดขนาดด้วย `maxAttachmentBytes`

---

## 🇬🇧 English

### Features

- **Duplicate media detection** — SHA-256 hashes each attachment and counts repeats within a time window (`duplicateMedia`)
- **Cross-channel image spam** — counts distinct channels used within the window (`mediaChannels`)
- **Link spam** — counts links and distinct channels used (`links` / `linkChannels`)
- **Automatic timeout** — mutes the offender for a configurable duration
- **Admin alerts** — sends an embed to a notification channel on detection
- **Whitelist** — ignore specific bots/users/roles/channels
- **Cooldown** — prevents repeated timeouts on the same user

### Requirements

- [Node.js](https://nodejs.org/) **v18+**
- A Discord bot token
- Bot permissions: `Manage Messages`, `Moderate Members`, `View Channels`, `Send Messages`

### Installation

```bash
# 1. Install dependencies
npm install

# 2. Create the .env file and add your bot token
copy .env.example .env      # Windows
# or  cp .env.example .env   # macOS / Linux

# 3. Run the bot
npm start
```

### Discord Developer Portal setup

1. Go to https://discord.com/developers/applications and create an Application + Bot
2. Enable **Privileged Gateway Intents** → turn on `MESSAGE CONTENT INTENT`
3. Invite the bot with: `Manage Messages`, `Moderate Members`, `View Channels`,
   `Send Messages`
4. **Important:** move the bot's role **above** regular members, otherwise it cannot timeout them

### `.env`

| Variable | Description |
| --- | --- |
| `DISCORD_TOKEN` | Discord bot token (required) |

### `config.json`

| Key | Default | Description |
| --- | --- | --- |
| `windowMs` | `30000` | Time window for counting events (ms) |
| `timeoutMs` | `600000` | Timeout duration (ms); 600000 = 10 minutes |
| `punishCooldownMs` | `60000` | Per-user cooldown between punishments |
| `deleteMessages` | `true` | Delete the detected message |
| `maxAttachmentBytes` | `8388608` | Max attachment size to hash (bytes) |
| `ignoreBots` | `true` | Ignore messages from bots |
| `ignoreUsers` | `[]` | User IDs to ignore |
| `ignoreRoles` | `[]` | Role IDs to ignore |
| `ignoreChannels` | `[]` | Channel IDs to ignore |
| `notifyChannelId` | `""` | Admin notification channel ID (empty = disabled) |
| `thresholds.duplicateMedia` | `3` | Duplicate media count to trigger |
| `thresholds.mediaChannels` | `4` | Distinct channels with media to trigger |
| `thresholds.links` | `4` | Link count to trigger |
| `thresholds.linkChannels` | `3` | Distinct channels with links to trigger |

### How it works

1. Listens for the `messageCreate` event
2. Skips bots/users/roles/channels on the whitelist
3. Collects events: hashes attachments + extracts links
4. Records them in a per-user sliding window (`windowMs`)
5. Evaluates rules in `src/detector.js`
6. On detection → deletes the message (optional), `member.timeout()`, sends an alert, and clears the user's history

### Project structure

```
bot/
├── src/
│   ├── index.js      # Entry point: Discord client, timeout + alerts
│   ├── config.js     # Config loading, token check, whitelist
│   ├── hash.js       # SHA-256 of attachments (size-limited)
│   ├── tracker.js    # Per-user sliding window
│   └── detector.js   # Spam detection rules
├── config.json       # Bot settings
├── .env.example      # Environment variable sample
└── package.json
```

### Limitations

- Detection is **behavioral** (frequency / repetition), not content scanning, so false positives are possible — tune the thresholds for your server
- Hashing attachments costs bandwidth; cap it with `maxAttachmentBytes`

---

## ☁️ Deploy 24/7 on DisCloud (ฟรี)

รันบอทบนคลาวด์โดยไม่ต้องเปิดคอมทิ้งไว้

1. ใส่โทเคนจริงใน `.env` และใส่ Application ID ใน `discloud.config` (`ID=...`)
2. สร้างไฟล์ zip สำหรับอัพโหลด:
   ```powershell
   powershell -ExecutionPolicy Bypass -File .\deploy-discloud.ps1
   ```
   จะได้ไฟล์ `discloud-upload.zip` (ตัด `node_modules` ออกให้อัตโนมัติ)
3. สมัคร/ยืนยันบัญชีที่ Discord Server ของ DisCloud
4. ไปที่ห้อง `#🔌・commands` พิมพ์ `.upconfig` แล้วส่งไฟล์ `discloud-upload.zip`
   (หรืออัพผ่าน Dashboard ของ DisCloud)

ไฟล์ที่เกี่ยวข้อง: `discloud.config` (ตั้งค่าแอป), `.discloudignore` (ไฟล์ที่ไม่ต้องอัพ)

| ตัวเลือก | คำอธิบาย |
| --- | --- |
| `NAME` | ชื่อแอปบน DisCloud |
| `TYPE=bot` | ระบุว่าเป็นบอท (รันเบื้องหลัง) |
| `MAIN=src/index.js` | ไฟล์เริ่มต้น |
| `RAM=100` | หน่วยความจำที่จอง (MB) |
| `ID` | Application ID ของบอท (จำเป็นสำหรับ Discord bot) |

### Deploy 24/7 on DisCloud (English)

1. Put the real token in `.env` and set the Application ID in `discloud.config` (`ID=...`)
2. Build the upload zip:
   ```powershell
   powershell -ExecutionPolicy Bypass -File .\deploy-discloud.ps1
   ```
   This produces `discloud-upload.zip` (excludes `node_modules` automatically)
3. Verify your account on the DisCloud Discord server
4. In `#🔌・commands`, run `.upconfig` and send `discloud-upload.zip`, or upload via the DisCloud Dashboard

---

## License

MIT

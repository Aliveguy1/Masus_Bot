# 📢 WhatsApp Group Broadcaster Bot

A WhatsApp bot that listens for a command in a group (only from you) and privately DMs every member your custom message.

---

## ✅ Features

- Trigger with a custom command: `/broadcast <your message>`
- Only **you** (the owner) can trigger it
- DMs every group member individually
- Rate-limited sending to reduce ban risk
- Auto-reconnects if disconnected
- Works with WhatsApp Business

---

## 📁 Project Structure

```
whatsapp-bot/
├── src/
│   ├── index.js      # Bot connection & QR auth
│   └── handler.js    # Command detection & DM logic
├── auth_info/         # Auto-created after first QR scan (DO NOT DELETE)
├── .env              # Your config (copy from .env.example)
├── .env.example      # Template
└── package.json
```

---

## 🚀 Local Setup (First Time)

### 1. Clone / Download the project

```bash
git clone <your-repo-url>
cd whatsapp-bot
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure your environment

```bash
cp .env.example .env
```

Open `.env` and fill in:
- `OWNER_NUMBER` — your WhatsApp number (no `+`, no spaces)
- `COMMAND_PREFIX` — default is `/broadcast`
- `MESSAGE_DELAY_MS` — delay between DMs (default 1500ms)

### 4. Run the bot (first time — scan QR)

```bash
npm start
```

A QR code will appear in your terminal.
Open WhatsApp → **Settings → Linked Devices → Link a Device** → Scan QR.

The `auth_info/` folder will be created automatically. Your session is saved there — you won't need to scan again.

---

## 💬 How to Use

1. Add the bot's WhatsApp number to any group as a member
2. Type in the group (from your number only):

```
/broadcast Good morning everyone! Meeting at 3PM today.
```

3. The bot will:
   - Confirm it's sending
   - DM every member your message
   - Report how many were sent/failed

---

## ☁️ Deploying to Render (Free)

> **Why not Vercel?** Vercel is serverless and can't hold a persistent WhatsApp connection. Render's free tier keeps your server alive.

### Steps:

1. Push your project to GitHub (exclude `auth_info/` and `.env` — add them to `.gitignore`)

2. Go to [render.com](https://render.com) → New → **Web Service**

3. Connect your GitHub repo

4. Settings:
   - **Environment:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Plan:** Free

5. Add Environment Variables in Render dashboard:
   - `OWNER_NUMBER`
   - `COMMAND_PREFIX`
   - `MESSAGE_DELAY_MS`

6. **Important — Auth Session on Render:**
   Since Render's free tier resets the filesystem, you have two options:
   
   **Option A (Simple):** Run the bot locally first, grab the `auth_info/` folder content, upload to Render using a persistent disk (Render paid feature).
   
   **Option B (Free):** Use a database to persist session. You can use [MongoDB Atlas](https://www.mongodb.com/atlas) (free tier) with the `baileys-store-multi-file-mongodb` package to store credentials.

---

## .gitignore

Create a `.gitignore` file:

```
node_modules/
auth_info/
.env
```

---

## ⚠️ Important Notes

- Using unofficial WhatsApp libraries violates WhatsApp's Terms of Service
- Risk of account ban, especially for bulk DMs to large groups
- Use responsibly — best for small, trusted groups where members expect contact
- Increase `MESSAGE_DELAY_MS` for larger groups (3000+ ms recommended)
- WhatsApp Business accounts are slightly more tolerant than personal accounts

---

## 🛠️ Customization

| What to change | Where |
|---|---|
| Command trigger | `COMMAND_PREFIX` in `.env` |
| Your number | `OWNER_NUMBER` in `.env` |
| Send speed | `MESSAGE_DELAY_MS` in `.env` |
| Message logic | `src/handler.js` |
| Connection settings | `src/index.js` |

---

## 📦 Dependencies

- [`@whiskeysockets/baileys`](https://github.com/WhiskeySockets/Baileys) — WhatsApp Web API
- `dotenv` — environment config
- `pino` — logging
- `@hapi/boom` — error handling

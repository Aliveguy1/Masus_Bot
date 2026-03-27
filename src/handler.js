require('dotenv').config();
const { generateVCF } = require('./vcf');

// ─── CONFIG ──────────────────────────────────────────────────────────────────
const OWNER_NUMBER      = process.env.OWNER_NUMBER;
const COMMAND_BROADCAST = process.env.COMMAND_PREFIX      || '/broadcast';
const COMMAND_VCF       = process.env.COMMAND_VCF         || '/vcf';
const CONTACT_SUFFIX    = process.env.CONTACT_SUFFIX      || 'MT🌹';
const MESSAGE_DELAY_MS  = parseInt(process.env.MESSAGE_DELAY_MS) || 1500;
// ─────────────────────────────────────────────────────────────────────────────

function getSenderNumber(msg) {
  const participant = msg.key.participant || msg.participant || msg.key.remoteJid;
  return participant.replace(/[^0-9]/g, '');
}

function getMessageText(msg) {
  return (
    msg.message?.conversation ||
    msg.message?.extendedTextMessage?.text ||
    msg.message?.imageMessage?.caption ||
    ''
  );
}

function delay(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

function jidToNumber(jid) {
  return jid.replace('@s.whatsapp.net', '').replace(/[^0-9]/g, '');
}

// ─── BROADCAST ────────────────────────────────────────────────────────────────
async function handleBroadcast(sock, msg, chatId, text) {
  const customMessage = text.slice(COMMAND_BROADCAST.length).trim();

  if (!customMessage) {
    await sock.sendMessage(chatId, { text: `⚠️ Usage: ${COMMAND_BROADCAST} <your message>` });
    return;
  }

  let groupMetadata;
  try { groupMetadata = await sock.groupMetadata(chatId); }
  catch { await sock.sendMessage(chatId, { text: '❌ Failed to fetch group members.' }); return; }

  const ownerJid = `${OWNER_NUMBER}@s.whatsapp.net`;
  const targets  = groupMetadata.participants.filter((m) => m.id !== ownerJid);

  await sock.sendMessage(chatId, { text: `📣 Sending to ${targets.length} members...` });

  let successCount = 0, failCount = 0;
  for (const member of targets) {
    try { await sock.sendMessage(member.id, { text: customMessage }); successCount++; }
    catch { failCount++; }
    await delay(MESSAGE_DELAY_MS);
  }

  await sock.sendMessage(chatId, {
    text: `✅ Broadcast complete!\n📨 Sent: ${successCount}\n❌ Failed: ${failCount}`,
  });
}

// ─── VCF ─────────────────────────────────────────────────────────────────────
async function handleVCF(sock, msg, chatId) {
  await sock.sendMessage(chatId, { text: '⏳ Building contact list, please wait...' });

  let groupMetadata;
  try { groupMetadata = await sock.groupMetadata(chatId); }
  catch { await sock.sendMessage(chatId, { text: '❌ Could not fetch group members.' }); return; }

  const members   = groupMetadata.participants;
  const groupName = groupMetadata.subject || 'Group';
  const contacts  = [];
  const mentionJids = [];

  for (const member of members) {
    const number = jidToNumber(member.id);
    mentionJids.push(member.id);

    // WhatsApp push name is stored in member.notify (Baileys exposes it here)
    const pushName = member.notify || null;

    const contactName = pushName
      ? `${pushName} ${CONTACT_SUFFIX}`
      : `${number} ${CONTACT_SUFFIX}`;

    contacts.push({ name: contactName, number });
  }

  const vcfBuffer = generateVCF(contacts);
  const fileName  = `${groupName.replace(/[^a-zA-Z0-9 ]/g, '').trim() || 'Group'}_contacts.vcf`;

  // Send the VCF file
  try {
    await sock.sendMessage(chatId, {
      document: vcfBuffer,
      mimetype: 'text/x-vcard',
      fileName,
      caption:
        `📇 *${groupName} — Group Contacts*\n` +
        `${contacts.length} contacts saved as *"Name ${CONTACT_SUFFIX}"*\n\n` +
        `📥 Download & import to save all members!`,
    });
  } catch (err) {
    console.error('Failed to send VCF:', err);
    await sock.sendMessage(chatId, { text: '❌ Failed to send VCF file.' });
    return;
  }

  await delay(2000);

  // Tag all members
  const mentionText =
    `👥 *Hey everyone!* 👆 Download the contact file above to save all group members.\n\n` +
    members.map((m) => `@${jidToNumber(m.id)}`).join(' ');

  await sock.sendMessage(chatId, {
    text: mentionText,
    mentions: mentionJids,
  });

  console.log(`✅ VCF sent + ${members.length} members tagged.`);
}

// ─── ROUTER ───────────────────────────────────────────────────────────────────
async function handleMessage(sock, msg) {
  const chatId  = msg.key.remoteJid;
  const isGroup = chatId.endsWith('@g.us');
  if (!isGroup) return;

  const senderNumber = getSenderNumber(msg);
  const text         = getMessageText(msg).trim();

  if (senderNumber !== OWNER_NUMBER) return; // Owner only

  if (text.toLowerCase().startsWith(COMMAND_BROADCAST.toLowerCase())) {
    await handleBroadcast(sock, msg, chatId, text);
    return;
  }

  if (text.toLowerCase().startsWith(COMMAND_VCF.toLowerCase())) {
    await handleVCF(sock, msg, chatId);
    return;
  }
}

module.exports = { handleMessage };

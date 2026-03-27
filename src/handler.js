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

// ─── BROADCAST 

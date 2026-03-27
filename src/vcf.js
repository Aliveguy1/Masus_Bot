/**
 * Generates a .vcf (vCard) file buffer from a list of contacts
 * Each contact: { name: string, number: string }
 */
function generateVCF(contacts) {
  const cards = contacts.map(({ name, number }) => {
    // Sanitize name — remove characters that break vCard
    const safeName = name.replace(/[;:]/g, ' ').trim();
    return [
      'BEGIN:VCARD',
      'VERSION:3.0',
      `FN:${safeName}`,
      `N:${safeName};;;;`,
      `TEL;TYPE=CELL:+${number}`,
      'END:VCARD',
    ].join('\r\n');
  });

  return Buffer.from(cards.join('\r\n'), 'utf-8');
}

module.exports = { generateVCF };

// utils/paystack-charges.js
/**
 * Calculate Paystack charges for a transaction amount
 * Based on Paystack's pricing: 1.5% + ₦100 for local cards, 3.9% for international cards
 * @param {number} amount - Transaction amount in Naira
 * @param {string} [channel='card'] - Payment channel (card, bank, etc.)
 * @returns {number} - Paystack charges in Naira
 */
export function calculatePaystackCharges(amount, channel = 'card') {
  const amountInKobo = amount * 100; // Convert to kobo for calculation
  
  let charges = 0;
  
  if (channel === 'card') {
    // Assume local cards by default (1.5% + ₦100)
    charges = (amountInKobo * 0.015) + 10000; // 1.5% + ₦100 in kobo
  } else if (channel === 'international_card') {
    // International cards (3.9%)
    charges = amountInKobo * 0.039;
  } else if (['bank', 'ussd', 'qr', 'mobile_money'].includes(channel)) {
    // Bank transfers, USSD, QR, Mobile Money (flat ₦100)
    charges = 10000; // ₦100 in kobo
  } else {
    // Default to card charges for unknown channels
    charges = (amountInKobo * 0.015) + 10000;
  }
  
  // Convert back to Naira and ensure minimum charge of ₦100
  const chargesInNaira = Math.max(100, charges / 100);
  
  return parseFloat(chargesInNaira.toFixed(2));
}
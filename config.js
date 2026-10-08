/* Nexven Drop — Firebase (Firestore REST). Rules: see FIREBASE_RULES.txt */
window.NEXVEN_CFG = {
  projectId: 'novus-roleplay',
  apiKey: 'AIzaSyCDdPwaB8mH9TsM5hyXFbF0fNpFaWXjmV0',
  databases: ['(default)'],
  prefix: 'nx_',
  /* Telegram Stars -> TON rate: 100 Stars = 1 TON (1 Star ≈ $0.015, 1 TON ≈ $1.5). This ONE number also prices every regular gift (gifts.js: stars / starsPerTon).
     The bot must use the same number: see BOT_STARS_RATE.txt. */
  starsPerTon: 100,
  /* v26: minimum Stars top-up (was 100) */
  depositMinStars: 10,
  /* v26: gift withdrawal rules. Only gifts worth >= wdMinTon can be withdrawn, and only while the player has withdrawal access.
     Access = one Stars top-up of >= wdAccessStars in the bot, which unlocks free withdrawal for wdAccessDays days. */
  wdMinTon: 1,
  wdAccessStars: 100,
  wdAccessDays: 7
};

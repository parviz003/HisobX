
export const BOT_TEXT = {
  startWithoutToken:
    'Salom! Bu — HisobX boti.\n\n' +
    'Hisobingizni ulash uchun ilovadagi "Telegramga ulash" tugmasidan foydalaning.',

  askContact:
    'Hisobingizni ulash uchun telefon raqamingizni tasdiqlang.\n\n' +
    'Pastdagi tugmani bosing — faqat o‘z raqamingizni yuboring.',

  shareButton: '📱 Raqamni ulashish',

  foreignContact:
    'Faqat <b>o‘z</b> raqamingizni yuborishingiz mumkin.\n' +
    'Pastdagi tugmani bosib qayta urinib ko‘ring.',

  phoneMismatch:
    'Bu raqam hisobga mos kelmadi.\n' +
    'Ilovaga kiritgan raqamingiz bilan bir xil raqamni yuboring.',

  linkExpired:
    'Havola eskirgan.\n' + 'Ilovaga qaytib, qaytadan urinib ko‘ring.',

  linked: '✅ Hisobingiz ulandi. Tasdiqlash kodi hozir yuboriladi.',
} as const;

export function otpMessage(code: string, ttlSeconds: number): string {
  const minutes = Math.max(1, Math.round(ttlSeconds / 60));
  return (
    `🔐 Tasdiqlash kodi: <b>${code}</b>\n\n` +
    `Kod ${minutes} daqiqa amal qiladi.\n` +
    'Kodni hech kimga bermang.'
  );
}

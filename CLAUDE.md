# HisobX — umumiy qoidalar

## Loyiha

HisobX — kichik va o'rta magazinlar uchun multi-tenant (SaaS) boshqaruv tizimi:
mahsulotlar, ombor, savdo, nasiya, mijoz qarzi, kassa, xarajatlar, hisobotlar,
qurilma sessiyalari.

## Monorepo tuzilmasi

- `client/` — frontend
- `server/` — backend (NestJS, Prisma, PostgreSQL, Redis)
- `docs/` — umumiy hujjatlar, API kontrakti (swagger.json)

## Agentlar uchun asosiy qoida

**Har bir agent faqat o'ziga berilgan papkada ishlaydi.**

- Frontend topshirig'i bajarilayotganda `server/` ichiga yozish **taqiqlanadi**.
- Backend topshirig'i bajarilayotganda `client/` ichiga yozish **taqiqlanadi**.
- Ikkala tomonni bog'laydigan yagona narsa — **Swagger orqali e'lon qilingan API kontrakti**.
  Frontend backend kodini o'qib emas, kontraktga tayanib ishlaydi.

Boshqa papkaga o'zgarish kerak bo'lib qolsa — o'zing qilma, buni topshiriq beruvchiga
aytib, alohida topshiriq so'ra.

## Umumiy talablar

- `.env` hech qachon commit qilinmaydi.
- Paket versiyalari topshiriqsiz yangilanmaydi, yangi paket topshiriqsiz qo'shilmaydi.
- Har bir papkaning o'z `CLAUDE.md` si bor — unda o'sha tomonning aniq qoidalari.

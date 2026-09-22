# HisobX backend — qoidalar

Bu papka HisobX loyihasining backend qismi. Ildizdagi `CLAUDE.md` dagi umumiy
qoidalar ham amal qiladi — jumladan, bu topshiriqda `client/` ichiga yozish taqiqlanadi.

## Stack

- **NestJS** (TypeScript) — qatlamli modulli monolit
- **Prisma** — ORM
- **PostgreSQL** — asosiy ma'lumotlar bazasi
- **Redis** — OTP, rate limiting, sessiya yordamchi holatlari

## Arxitektura

Qat'iy qatlamli tuzilma. Har bir modul `src/modules/<nom>/` ichida:

- `*.controller.ts` — faqat HTTP: marshrut, DTO validatsiyasi, javob qaytarish.
  Biznes mantiq controllerda yozilmaydi.
- `*.service.ts` — biznes mantiq va ma'lumotlar bazasi bilan ishlash.
- `dto/` — kirish/chiqish shakllari, `class-validator` bilan.

Umumiy narsalar: `src/common/` (guard, filter, decorator, interface),
`src/infrastructure/` (fayl, tashqi servislar), `src/config/` (env).

## Javob formati

Barcha endpointlar bir xil shaklda javob qaytaradi:

```json
{ "statusCode": 200, "data": { } }
```

Xatolar global `AllExceptionsFilter` orqali ham shu formatda chiqadi.
Bu formatni buzadigan javob qaytarma.

## Autentifikatsiya

- **Cookie-based JWT** — access va refresh tokenlar cookie orqali beriladi.
  Tokenni javob body'siga qaytarma.
- Qurilma (device) sessiyalari kuzatiladi.

## Multi-tenant

- `storeId` **faqat tokendan** olinadi.
- Mijoz yuborgan `storeId` ga (body, query, param yoki header) **hech qachon ishonilmaydi**.
- Har bir so'rovda ma'lumot faqat token egasining do'koni doirasida qaytariladi.

## Swagger

Endpoint, DTO yoki javob shakli o'zgarsa — **o'sha o'zgarish bilan birga Swagger
hujjati ham yangilanadi**. Swagger frontend uchun yagona kontrakt manbai, shuning
uchun u kod bilan bir xil bo'lishi shart.

- Swagger UI — `/api/v1/docs`
- Swagger JSON — `/api/v1/docs-json`

## Cheklovlar

- Biznes mantiqqa oid o'zgarish **faqat aniq topshiriq bilan** qilinadi.
  Yo'l-yo'lakay "yaxshilash" qilinmaydi.
- Prisma schema va migratsiyalar topshiriqsiz o'zgartirilmaydi.
- Xavfsizlik kodiga (guard, token, parol, rate limiting) topshiriqsiz tegilmaydi.
- `.env` commit qilinmaydi; yangi env kaliti qo'shilsa, `.env.example` ga ham qo'shiladi.

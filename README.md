# HisobX

Kichik va o'rta magazinlar uchun ko'p foydalanuvchili (multi-tenant SaaS) boshqaruv tizimi:
mahsulotlar, ombor, savdo, nasiya, mijoz qarzi, kassa, xarajatlar, hisobotlar va
qurilma sessiyalari yagona joyda boshqariladi.

## Tuzilma

```
HisobX/
├── client/     # Frontend (keyingi bosqichda qo'shiladi)
├── server/     # Backend — NestJS + Prisma + PostgreSQL + Redis
├── docs/       # Umumiy hujjatlar (API kontrakti, swagger.json)
└── README.md
```

`client/` va `server/` bir-biriga to'g'ridan-to'g'ri bog'lanmaydi — yagona aloqa nuqtasi
Swagger orqali e'lon qilingan API kontrakti.

## Backend'ni ishga tushirish

Talablar: Node.js 20+, pnpm, ishlayotgan PostgreSQL va Redis.

```bash
cd server
cp .env.example .env     # qiymatlarni o'z muhitingizga moslang
pnpm install
pnpm prisma migrate deploy
pnpm start:dev
```

Server `http://localhost:3000` da ko'tariladi:

- API prefiksi — `/api/v1`
- Swagger UI — `http://localhost:3000/api/v1/docs`
- Swagger JSON — `http://localhost:3000/api/v1/docs-json`
- Yuklangan fayllar — `http://localhost:3000/api/v1/uploads/<fayl>`

Batafsil texnik topshiriq: [server/TZ.md](server/TZ.md).

## Frontend

Frontend — React 19 + TypeScript + Vite asosidagi PWA. Asosan telefonda ishlatiladi va
telefonga o'rnatiladi. Backend bilan faqat Swagger kontrakti orqali bog'lanadi.

### Ishga tushirish

```bash
cd client
cp .env.example .env
pnpm install
pnpm dev
```

Dev server `http://localhost:5173` da ochiladi. `/api` so'rovlari `VITE_PROXY_TARGET`
(standart `http://localhost:3010`) ga proxy qilinadi — backend ham ishlab turishi kerak.

### Muhit o'zgaruvchilari (`client/.env`)

| Kalit | Ma'nosi |
|---|---|
| `VITE_API_URL` | API bazaviy manzili, standart `/api/v1` |
| `VITE_PROXY_TARGET` | Dev proxy backend manzili, standart `http://localhost:3010` |
| `VITE_APP_NAME` | Ilova nomi |
| `VITE_USE_MOCKS` | `true` bo'lsa, backend'da hali yo'q endpoint'lar MSW mock'idan olinadi |
| `VITE_TELEGRAM_BOT_URL` | Telegram bot manzili |

### Skriptlar

| Buyruq | Vazifasi |
|---|---|
| `pnpm dev` | Dev server (lokal tarmoqqa ham ochiq) |
| `pnpm build` | Production build |
| `pnpm preview` | Build natijasini ko'rish |
| `pnpm typecheck` | TypeScript tekshiruvi |
| `pnpm lint` | ESLint |
| `pnpm test` | Vitest |
| `pnpm e2e` | Playwright (10-bosqichda to'ldiriladi) |
| `pnpm api:fetch` | Backend'dan Swagger'ni `docs/swagger.json` ga yuklaydi |
| `pnpm api:generate` | Swagger'dan tip va query hooklarini generatsiya qiladi |

### Swagger'dan tiplarni yangilash

Backend endpointi o'zgarsa:

```bash
cd ../server && pnpm start:dev     # backend ishlab tursin
cd ../client
pnpm api:fetch      # docs/swagger.json yangilanadi
pnpm api:generate   # src/lib/api/generated qayta yaratiladi
```

Generatsiya natijasi qo'lda tahrirlanmaydi.

### Mock rejimi

Backend'da hali mavjud bo'lmagan endpoint'lar (dashboard, Telegram ulanish holati,
eslatmalar jadvali) MSW orqali mock qilinadi. `client/.env` da `VITE_USE_MOCKS=true`
bo'lsa faqat o'sha yo'llar mock'dan olinadi, qolgan hamma so'rov haqiqiy backend'ga ketadi.

### Telefonda sinash

`pnpm dev` lokal tarmoqqa ochiq (`host: true`). Terminalda ko'rsatilgan
`http://192.168.x.x:5173` manzilini telefon brauzerida oching (telefon va kompyuter
bitta Wi-Fi da bo'lsin). Kamera (barcode skanerlash) faqat HTTPS yoki `localhost` da
ishlaydi — lokal IP orqali kamera ishlamaydi.

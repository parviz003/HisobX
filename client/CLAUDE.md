# HisobX frontend (`client/`) — qoidalar

Bu fayl frontend topshirig'ining 0–5-bo'limlaridan ko'chirilgan kelishuvlar.
Yangi kelishuv paydo bo'lsa, shu fayl yangilanadi. Ildizdagi `CLAUDE.md` ham amal qiladi.

---

## 0. Ish tartibi va qat'iy qoidalar

### Monorepo

    HisobX/
    ├── client/     # FRONTEND — ish joyi
    ├── server/     # BACKEND (NestJS) — FAQAT O'QISH
    ├── docs/       # TZ.md, swagger.json
    ├── .gitignore
    ├── CLAUDE.md
    └── README.md

### Qat'iy qoidalar

1. Barcha frontend fayllari faqat `client/` ichida. Paketlar `client/` ichida o'rnatiladi.
   Ildizda `package.json` yaratilmaydi, pnpm workspaces sozlanmaydi.
2. **`server/` ga hech narsa yozilmaydi, o'zgartirilmaydi, o'chirilmaydi.** Undan faqat o'qish mumkin.
   Backend'da biror narsa kerak bo'lsa — hisobotning "Backend'dan kerak" bo'limiga yoziladi.
3. Ildizdagi umumiy fayllar: `.gitignore` ga faqat frontend qatorlari; `README.md` ga faqat
   "Frontend" bo'limi; `docker-compose.yml` va `.github/` faqat 10-bosqichda.
   Ildiz `CLAUDE.md` va `docs/TZ.md` o'zgartirilmaydi.
4. Barcha buyruqlar `client/` ichida: `cd client && pnpm ...`.
5. Har bosqich oxirida `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build` xatosiz o'tishi shart.
6. Har bosqich alohida branch: `feature/client-01-foundation`, `feature/client-02-auth`, ...
   Conventional commits: `feat(client):`, `fix(client):`, `chore(client):`, `test(client):`.
   Push va PR — loyiha egasi o'zi qiladi.
7. Endpoint o'ylab topilmaydi. Yagona manba — `docs/swagger.json`. Swagger'da yo'q, lekin
   5.2-bo'limda kelishilgan endpoint'lar uchun MSW mock va `TODO(backend)` belgisi.
   Ikkalasida ham yo'q narsa kerak bo'lsa — to'xtab so'raladi.

### Backend bilan aloqa

- Backend porti — `server/.env` dagi `PORT` (hozir **3010**).
- Swagger JSON: `http://localhost:3010/api/v1/docs-json` → `docs/swagger.json` (`pnpm api:fetch`).
- orval shu fayldan tip va hooklarni generatsiya qiladi (`pnpm api:generate`).
- Vite proxy manzili: `client/.env` dagi `VITE_PROXY_TARGET`.

---

## 1. Loyiha konteksti

HisobX — kichik va o'rta magazinlar uchun multi-tenant SaaS: mahsulotlar, ombor, savdo (POS),
nasiya, mijoz qarzlari, kassa, xarajatlar, hisobotlar, xodimlar, qurilma sessiyalari.

### O'zgartirilmaydigan qarorlar

- Ilova asosan **telefonda** ishlatiladi va telefonga o'rnatiladi (PWA). Har ekran avval
  telefon (360–430px) uchun, keyin planshet va kompyuter uchun.
- Faqat **online** ishlaydi. Internet uzilsa banner chiqadi, offline savdo yo'q.
- Tillar: o'zbek (lotin) asosiy, rus ikkinchi.
- Valyuta faqat so'm: `1 250 000 so'm`.
- Chek printer yo'q — "Chek" tugmasi `ComingSoonButton`.
- **Signup yo'q.** Ro'yxatdan o'tish sahifasi ham, `/auth/signup` chaqiruvi ham bo'lmaydi.
- OTP kodlar SMS emas, **Telegram bot** orqali.
- Production'da bitta domen: `/` frontend, `/api/v1/` backend.

### Rollar

| Rol | Kim yaratadi | Huquqlari |
|---|---|---|
| SUPERADMIN | tizimda bitta | do'kon yaratadi (+MENEJER), faollashtiradi/to'xtatadi, istalgan do'konni **faqat ko'rish** rejimida ko'radi |
| MANAGER | SUPERADMIN | do'kondagi hamma narsa: adminlar va sotuvchilar, sozlamalar, eslatmalar, kassa nazorati |
| ADMIN | MANAGER | adminlarni boshqarish va do'kon sozlamalaridan tashqari hammasi |
| SELLER | MANAGER/ADMIN | savdo, o'z savdolari, mahsulotlar (tannarxsiz), mijozlar, qarz to'lovi |

Ruxsatlar matritsasi **bitta joyda**: `src/lib/permissions.ts`. UI shunga qat'iy amal qiladi;
asosiy himoya baribir backend'da.

### Biznes qoidalari

- Sof foyda = Tushum − Tannarx (COGS) − Xarajatlar. **Hammasini backend hisoblaydi.**
- Nasiya (CREDIT) faqat mavjud mijoz bilan; qarz avtomatik yaratiladi.
- Naqd savdo va qarz to'lovi kassani oshiradi, xarajat kamaytiradi.
- Zaxira manfiy bo'lmaydi.
- `dona` → butun son; `kg`/`litr` → 3 xonagacha kasr.
- Chegirma faqat foizda.

---

## 2. Stack (o'zgartirilmaydi)

React 19 + TypeScript (strict) + Vite · pnpm · Tailwind v4 + shadcn/ui + lucide-react ·
React Router (data router) · TanStack Query · TanStack Table · React Hook Form + Zod ·
Zustand (faqat POS savati va UI holati) · Axios · date-fns · i18next + react-i18next ·
Recharts · orval · vite-plugin-pwa · @fontsource-variable/inter · qrcode.react ·
@zxing/browser · Vitest + Testing Library + MSW · Playwright · (10-bosqichda ixtiyoriy @sentry/react)

Ro'yxatdan tashqari kutubxona qo'shilmaydi.

---

## 3. Dizayn tizimi

- **Ranglar:** primary emerald (light 600, dark 500). Neytral light'da slate (fon `slate-50`,
  kartalar oq), dark'da zinc (fon `zinc-950`, kartalar `zinc-900`). Semantik: success emerald,
  warning amber, xato/qarz rose, info sky. Pul: kirim yashil, chiqim qizil, qarz rose.
  Kontrast WCAG AA dan past emas. Tokenlar — `src/index.css`.
- **Tipografiya:** Inter Variable. Pul raqamlari `tabular-nums` (`.tabular` klassi).
  Ekran sarlavhasi 22–24px, karta sarlavhasi 16px, asosiy matn 15–16px, yordamchi 13px.
  Telefonda matn 13px dan kichik emas.
- **Shakl:** kartalar `rounded-2xl`, tugma/inputlar `rounded-xl`. Dark'da soya o'rniga nozik border.
  Bo'shliqlar 4px shkalada, telefonda chetdan 16px. Bosiladigan elementlar ≥44×44px (`.min-h-touch`).
- **Joylashuv:** telefonda pastki tab bar (maks 5) + ajratilgan POS tugmasi; planshet/desktopda sidebar.
  Forma va tanlov oynalari — `ResponsiveDialog` (telefonda Drawer, desktopda Dialog).
  Safe-area: `.pt-safe` / `.pb-safe`.
- **Harakat:** 150–250ms, yumshoq. `prefers-reduced-motion` da o'chadi. Faqat Tailwind/CSS.
- **Holatlar:** skeleton (spinner emas), `EmptyState`, `ErrorState` ("Qayta urinish"), toast'lar.
- **Brend:** emerald fonli "H" ikonkasi + matnli logotip (`BrandLogo`). PWA ikonkalari shundan.

---

## 4. Global qoidalar

### Kod

1. Kod va fayl nomlari inglizcha. UI matnlari **faqat i18n kalitlari** orqali.
2. **`any` taqiqlangan.** Tiplar orval generatsiyasidan.
3. Tokenlar httpOnly cookie'da. **localStorage/sessionStorage'da token yoki foydalanuvchi
   ma'lumoti saqlanmaydi.** Axios `withCredentials: true`.
4. Server ma'lumotlari faqat TanStack Query'da. Har feature'da `queryKeys.ts`.
   Mutatsiyadan keyin tegishli query'lar invalidate qilinadi.
5. Ro'yxatlar: server-side pagination, filtr, qidiruv (debounce 300ms). Filtrlar URL query'da.
   Telefonda kartalar + "Ko'proq yuklash", desktopda jadval (`DataList`).
6. Formalar: RHF + Zod; backend 400 xatolari maydonlarga bog'lanadi; submit'da tugma disabled;
   muvaffaqiyatda toast.
7. Xavfli amallar — `ConfirmDialog`.
8. Pul: backend butun son (so'm) qaytaradi. Yakuniy qiymat float bilan hisoblanmaydi.
   Doim `formatMoney`, `formatQuantity`, `formatDate`, `formatDateTime`, `formatPhone`.
9. Telefon: `+998` maska, backend'ga `+998901234567`.
10. Accessibility: har inputda label, ko'rinadigan focus, ikonka-tugmalarda `aria-label`, klaviatura.
11. Route va menyu `RoleGuard` va `useCan(action)` orqali.
12. Fayl ~250 qatordan oshsa bo'linadi.

### API

- Base URL `/api/v1` (`VITE_API_URL`). Dev'da Vite proxy `/api` → `VITE_PROXY_TARGET`.
- Javoblar `{ statusCode, data }` — interceptor `data` ni avtomatik ochadi.
- Backend `forbidNonWhitelisted` — faqat Swagger'dagi maydonlar yuboriladi.
- **401:** bitta marta `POST /auth/refresh` (single-flight). `/auth/refresh` yoki `/auth/signout`
  ning o'zi 401 bersa — sessiya tugagan: cache tozalanadi, `/login?redirect=...`. Aylanma yo'q.
- **Tab sinxronizatsiyasi:** BroadcastChannel (`src/lib/api/session.ts`).
- **429:** `Retry-After` dan soniya, teskari sanoq, avtomatik qayta urinish YO'Q.
  TanStack Query retry 401/403/404/429 da o'chiq.
- **403:** "Bu amal uchun ruxsat yo'q". **500:** umumiy xabar, texnik tafsilotsiz.
- Xatolar yagona `ApiError` tipida: `{ status, message, fieldErrors?, retryAfter?, code? }`.
- SUPERADMIN ko'rish rejimida barcha GET'larga `x-store-id`.
- Rasm: `multipart/form-data`, maydon `image`, maks 10 MB, jpg/png/webp.
  URL'lar `/api/v1/uploads/...`.

### Papka tuzilmasi

    src/
      app/         router.tsx, navigation.ts, providers/, layouts/, guards/, pages/
      features/    har biri: api/, components/, hooks/, pages/, schemas/, queryKeys.ts
      components/  ui/ (shadcn), common/ (umumiy komponentlar)
      lib/         api/ (client.ts, errors.ts, session.ts, generated/), format.ts,
                   permissions.ts, i18n/, utils.ts
      hooks/  mocks/  locales/uz/*.json  locales/ru/*.json  test/
    e2e/

---

## 5. Backend endpoint'lari

### 5.1. Mavjud (Swagger'da bor)

`docs/swagger.json` — yagona manba. Hammasi `/api/v1` prefiksi bilan.
Auth, device, users, stores, categories, products, inventory, customers, sales, debts,
cash, expenses, reports (daily/monthly), telegram.

**Swagger'da `POST /auth/signup` bor — ISHLATILMAYDI.**

### 5.2. Hali yo'q, lekin kelishilgan (`TODO(backend)` + MSW mock)

`VITE_USE_MOCKS=true` bo'lganda faqat shu yo'llar mock'dan, qolgani haqiqiy backend'dan
(`onUnhandledRequest: 'bypass'`). Handlerlar — `src/mocks/handlers.ts`.

1. **MANAGER roli** — `role` enum'iga qo'shiladi; `/stores/onboard` MANAGER yaratadi;
   MANAGER → ADMIN va SELLER, ADMIN → faqat SELLER.
2. **Signup olib tashlanadi.**
3. **Telegram OTP:** `/auth/signin` javobi `{telegramLinked:true, expiresAt, resendAvailableAt}`
   yoki `{telegramLinked:false, linkToken, botUrl, linkExpiresAt}`.
   `GET /auth/telegram-link-status?token=` → `{linked, expiresAt?, resendAvailableAt?}`
   (2 soniyada bir, maks 10 daqiqa).
   `/auth/forgot-password` javobi raqam mavjudligini oshkor qilmaydi.
4. **Kasr miqdor** — `kg`/`litr` uchun 3 xonagacha.
5. **Kassa tuzatish** — qo'lda faqat `OPENING` va `ADJUSTMENT`; ADJUSTMENT'da `amount` musbat
   yoki manfiy, `note` majburiy; javobda `user.fullName`.
6. **Savdoni bekor qilish** — faqat MANAGER va ADMIN.
7. **Mijoz Telegram:** `POST /customers/:id/telegram-link` → `{linkToken, botUrl, expiresAt}`;
   `telegramLinked: boolean`; `POST /customers/:id/remind` (kuniga 1 marta, aks holda 429).
8. **Eslatmalar jadvali:** `GET/PATCH /stores/me/reminder-settings` →
   `{enabled, daysBefore[], onDueDate, overdueEveryDays}`.
9. **Dashboard:** `GET /reports/dashboard`, `/reports/sales-chart?days=`,
   `/reports/top-products?days=&limit=`, `/reports/seller-today`.
10. **Kutishga qo'yilgan savdolar** — faqat lokal (localStorage), backend kerak emas.

### Kontraktdagi ma'lum bo'shliqlar (1-bosqichda aniqlangan)

- Swagger'da **javob (response) sxemalari umuman yo'q** — orval barcha hooklar uchun `unknown`
  qaytaradi. Javob tiplari vaqtincha qo'lda e'lon qilingan (`TODO(backend)` bilan).
- Bir qancha DTO bo'sh: `CreateSaleDto`, `CreateCustomerDto`, `CreateInventoryDto`,
  `MakePaymentDto`, `UpdateProductDto`, `CreateCategoryDto`, `UpdateCategoryDto`, `UpdateStoreDto`.
- `role` enum'ida `MANAGER` yo'q (faqat `ADMIN`, `SELLER`).

---

## 6. Hech qachon qilinmaydi

- `server/` ga yozish.
- Ildizda `package.json` yoki pnpm workspaces.
- Token yoki foydalanuvchi ma'lumotini localStorage/sessionStorage'da saqlash.
- Signup sahifasi yoki `/auth/signup` chaqiruvi.
- Foyda, qoldiq, qarz qoldig'ini frontend'da hisoblash.
- Swagger'da yoki 5.2 da yo'q endpoint'ni o'ylab topish.
- Stack ro'yxatidan tashqari kutubxona.
- Qabul mezonlari bajarilmasdan "tayyor" deyish.

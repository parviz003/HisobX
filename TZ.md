# HisobX — Kichik va O‘rta Bizneslar Uchun Savdo va Ombor Boshqaruvi Tizimi (SaaS)
## Mukammal Texnik Topshiriq (Technical Specification — TZ)

---

## 1. Loyiha Haqida Umumiy Ma'lumot

**HisobX** — savdo do‘konlari, mini-marketlar, chakana va ulgurji savdo nuqtalari uchun mo‘ljallangan ko‘p do‘konli (Multi-tenant SaaS) boshqaruv platformasi.

### 1.1. Loyihaning Maqsadi
Do‘kon egalari, menejerlar va sotuvchilarga do‘konning barcha kundalik jarayonlarini yagona, qulay va xavfsiz tizimda yuritish imkoniyatini yaratish:
- Tezkor POS (Point of Sale) savdo va chek shakllantirish;
- Tovarlar qoldig‘i, kirim, chiqim va ombor inventarizatsiyasi;
- Mijozlar bilan nasiya (qarz) hisob-kitoblari va muddat nazorati;
- Kassa kirim-chiqimlari va naqd pul balansi;
- Do‘kon xarajatlari hisobi;
- Aniq moliyaviy natijalar: yalpi tushum, tannarx (COGS), yalpi foyda va sof foyda tahlili;
- Telegram orqali 2FA tasdiqlash, biznes bildirishnomalari va avtomatik hisobotlar;
- Qurilmalar xavfsizligi va sessiyalar monitoringi.

### 1.2. Asosiy Foydalanuvchilar va Rollar
1. **SUPERADMIN (Platforma Administratori):** Yangi do‘konlarni ro‘yxatdan o‘tkazish (onboarding), tizim do‘konlarini monitoring qilish va `x-store-id` orqali istalgan do‘konni ko‘rish rejimiga o‘tish.
2. **ADMIN (Do‘kon Rahbari / Egasi):** O‘z do‘konidagi barcha jarayonlarni to‘liq nazorat qilish (xodimlar, narxlar, hisobotlar, sozlamalar, kassa, tovarlar).
3. **MANAGER (Do‘kon Menejeri):** Do‘konning kundalik faoliyatini yuritish (tovarlar, ombor harakatlari, xodimlar ro‘yxati, kassa, hisobotlar).
4. **SELLER (Kassir / Sotuvchi):** Tezkor POS savdo qilish, chek chiqarish, tovarlarni ko‘rish, qarz to‘lovlarini qabul qilish.

---

## 2. Texnologik Stek va Arxitektura

### 2.1. Backend (server)
- **Asosiy Framework:** NestJS 11+ (TypeScript, Node.js 20+)
- **Arxitektura:** Qatlamli Modulli Monolit (Layered Modular Monolith)
- **Ma'lumotlar Bazasi:** PostgreSQL
- **ORM & Driver:** Prisma 7 (`@prisma/adapter-pg` driver adapteri bilan)
- **Kesh & Xotira:** Redis (`ioredis`) — OTP, Rate Limiter va vaqtinchalik ma'lumotlar uchun
- **Autentifikatsiya:** Cookie-based JWT (Access Token & Refresh Token), Bcrypt xeshlash
- **Media / Fayllar:** Multer + Sharp (rasmlarni avtomatik siqish va `.webp` formatga aylantirish)
- **Telegram Integratsiyasi:** Telegram Bot API (2FA OTP, xabarnomalar, avtomatik monitoring)
- **Monitoring & Xavfsizlik:** Throttler (Redis bilan Rate Limiting), Helmet, CORS, AllExceptionsFilter
- **Hujjatlashtirish:** Swagger / OpenAPI 3.0 (`@nestjs/swagger`)

### 2.2. Frontend (client)
- **Kutubxona & Muhit:** React 19 + TypeScript + Vite
- **Mobil Ilova & PWA:** Vite PWA Plugin, Service Worker kesh, Offline Banner
- **Styling:** Tailwind CSS v4, Radix UI Primitives, Lucide Icons, CVA
- **Server Holati & So'rovlar:** TanStack Query v5 (React Query), Axios (withCredentials: true)
- **Jadvallar & Shakllar:** TanStack Table v9, React Hook Form, Zod sxemalari
- **Grafiklar & Vizualizatsiya:** Recharts
- **Mahalliylashtirish (i18n):** `i18next` (To'liq o'zbek tilida)
- **Skanerlash:** `@zxing/browser` (Kamera orqali shtrix-kod o'qish)

---

## 3. Loyiha Tuzilmasi

```text
HisobX/
├── docs/                      # API hujjatlari va generatsiya qilingan swagger.json
├── server/                    # NestJS Backend loyihasi
│   ├── prisma/
│   │   ├── schema.prisma      # Barcha jadvallar, munosabatlar va enumlar
│   │   └── migrations/        # SQL migratsiyalari
│   ├── src/
│   │   ├── main.ts            # Ilova bootstrap kirish nuqtasi
│   │   ├── app.service.ts     # Global sozlamalar (Helmet, CookieParser, Swagger)
│   │   ├── app.module.ts      # Ildiz moduli (Guards, Throttler, Filters)
│   │   ├── config/            # Env, Redis va Prisma konfiguratsiyalari
│   │   ├── infrastructure/    # Statik yordamchi modullar (Crypt, Token, File, TelegramApi)
│   │   ├── common/            # Umumiy dekoratorlar, filtrlar, gardlar, pipelar
│   │   └── modules/           # Biznes modullari:
│   │       ├── auth/          # Kirish, sessiyalar, qurilmalar, parolni tiklash
│   │       ├── otp/           # Redis asosidagi 2FA OTP tizimi
│   │       ├── stores/        # Do'konlar va SUPERADMIN onboardingi
│   │       ├── users/         # Xodimlar va shaxsiy profil boshqaruvi
│   │       ├── categories/    # Mahsulot toifalari
│   │       ├── products/      # Mahsulotlar katalogi va narxlar
│   │       ├── inventory/     # Ombor kirim, chiqim va to'g'rilashlari
│   │       ├── sales/         # POS savdo va savdo tarixi
│   │       ├── customers/     # Mijozlar bazasi
│   │       ├── debts/         # Nasiyalar daftari va qarz to'lovlari
│   │       ├── cash/          # Kassa operatsiyalari va balansi
│   │       ├── expenses/      # Do'kon xarajatlari va toifalari
│   │       ├── reports/       # Moliyaviy va tahliliy hisobotlar
│   │       ├── telegram/      # Telegram bot integratsiyasi va bildirishnomalar
│   │       └── notifications/ # Tizim bildirishnomalari jurnali
│   └── test/                  # Jest E2E va integratsion testlar
└── client/                    # React PWA Frontend loyihasi
    ├── public/                # Ikonkalar, manifest.json, statik fayllar
    └── src/
        ├── app/               # Marshrutlar, qobiqlar (AppLayout, AuthLayout) va gardlar
        ├── components/        # Umumiy UI komponentlar (dialoglar, jadvallar, tugmalar)
        ├── features/          # Har bir domen bo'yicha modullar (auth, pos, sales, reports...)
        ├── hooks/             # Maxsus hooklar (useCountdown, useMediaQuery, useDebounce...)
        ├── lib/               # Yordamchi utilitalar, formatlash, API mijozi
        └── locales/           # Mahalliylashtirish resurslari (uz/auth.json, catalog.json...)
```

---

## 4. Xavfsizlik, Sessiyalar va Autentifikatsiya

### 4.1. Kirish Oqimi (Sign-In)
1. **1-qadam (Parol tekshiruvi):** Foydalanuvchi telefon raqami (`+998...`) va parolini yuboradi (`POST /auth/signin`).
2. **2-qadam (Telegram ulanish holati):**
   - Agar hisob Telegram botga ulanmagan bo‘lsa (`telegramChatId === null`), tizim `telegramLinked: false` va bir martalik ulanish havolasini (`botUrl`) qaytaradi.
   - Foydalanuvchi botda «Start» va «Raqamni ulashish» orqali o‘z hisobini tasdiqlaydi.
3. **3-qadam (2FA OTP yuborish):**
   - Hisob ulangan bo‘lsa, Redisda 6 xonali tasodifiy OTP kod yaratiladi (`crypto.createHmac('sha256')`).
   - Kod to‘g‘ridan-to‘g‘ri foydalanuvchining shaxsiy Telegram botiga yuboriladi.
   - OTP cheklovlari: amal qilish muddati 120 soniya, qayta yuborish cooldown — 60 soniya, xato kiritish limiti — 3 ta urinish.
4. **4-qadam (Tasdiqlash va Sessiya):**
   - Foydalanuvchi 6 xonali kodni kiritadi (`POST /auth/confirm`).
   - Muvaffaqiyatli tekshiruvdan so‘ng backend `httpOnly`, `sameSite: Lax`, `secure` bayroqlari bilan `accessToken` va `refreshToken` cookie-fayllarini o‘rnatadi.
   - Tokenlar brauzer JavaScript kodiga (`localStorage`/`sessionStorage`) hech qachon berilmaydi.

### 4.2. Tokenlar Rotatsiyasi va Grace Period
- **Access Token:** Muddati 15 daqiqa. Har bir so‘rovda avtomatik cookie orqali uzatiladi.
- **Refresh Token:** Muddati 7 kun. Yangilash so‘rovi (`POST /auth/refresh`) yuborilganda:
  - Bazadagi `Devices.hashedRefreshToken` solishtiriladi.
  - Yangi token juftligi generatsiya qilinadi.
  - Tarmoqdagi parallel so‘rovlar uzilib qolmasligi uchun oldingi token 30 soniyalik Grace Period (`prevHashedRefreshToken`) davomida yaroqli bo‘lib turadi.
  - Eski token Grace davridan tashqarida qayta ishlatilsa, tizim o‘g‘irlik deb baholaydi va barcha sessiyalarni darhol bekor qiladi.

### 4.3. Qurilmalar Nazorati (Device Tracking)
- Har bir sessiya qurilmasi User-Agent orqali tahlil qilinadi (`device-detector-js`): Qurilma nomi, brauzer, OS, qurilma turi (desktop/smartphone), IP-manzil.
- Bitta foydalanuvchi uchun maksimal faol qurilmalar soni cheklanadi (masalan, 3 ta). Limit to‘lganda `DEVICE_LIMIT_REACHED` (403) qaytadi.
- Xavfsizlik qoidasi: Yaqinda qo‘shilgan yangi qurilmani o‘chirish uchun 24 soatlik xavfsizlik vaqti (`canRemoveAt`) talab qilinadi.

---

## 5. Ma'lumotlar Bazasi Sxemasi (Prisma)

### 5.1. Tizim Enum turlari
- **Role:** `SUPERADMIN`, `MANAGER`, `ADMIN`, `SELLER`
- **Status:** `ACTIVE`, `INACTIVE`
- **SaleStatus:** `DRAFT`, `CONFIRMED`, `COMPLETED`, `CANCELLED`
- **PaymentType:** `CASH` (Naqd pul), `CREDIT` (Nasiya / Qarz)
- **CashTransactionType:** `SALE`, `DEBT_PAYMENT`, `EXPENSE`, `OPENING`, `ADJUSTMENT`
- **InventoryTransactionType:** `PURCHASE`, `SALE`, `WRITE_OFF`, `OPENING`, `ADJUSTMENT`
- **NotificationType:** `DEBT_REMINDER`, `DEBT_OVERDUE`, `LOW_STOCK`, `DAILY_REPORT`

### 5.2. Jadvallar va Munosabatlar

#### 1. Store (Do‘kon / Tenant)
Do‘kon asosiy korxona obyekti bo‘lib, barcha jadvallar `storeId` orqali unga bog‘lanadi (SaaS izolyatsiyasi).
- `id`: Int (PK)
- `name`: String (Do‘kon nomi)
- `phone`: String? (Do‘kon aloqa raqami)
- `address`: String? (Manzil)
- `telegramChatId`: String? (Do‘konning maxsus Telegram guruhi chat IDsi)
- `isActive`: Boolean (Standart: `true`)
- Bog‘lanishlar: Users, Products, Categories, Customers, Sales, Debts, CashTransactions, Expenses, InventoryTransactions, Notifications.

#### 2. User (Foydalanuvchi / Xodim)
- `id`: Int (PK)
- `phone`: String (Unique, `+998...` formatida)
- `password`: String (Bcrypt xesh)
- `fullName`: String? (Ism va familiya)
- `role`: Role (`SUPERADMIN`, `MANAGER`, `ADMIN`, `SELLER`)
- `status`: Status (`ACTIVE`, `INACTIVE`)
- `imageUrl`: String? (Profil rasmi manzili)
- `telegramChatId`: String? (Unique, OTP kodlar yuboriladigan shaxsiy Telegram ID)
- `telegramLinkedAt`: DateTime?
- `storeId`: Int? (Superadmin uchun `null`, qolgan xodimlar uchun majburiy)

#### 3. Devices (Qurilma Sessiyalari)
- `deviceId`: Int (PK)
- `device`, `browser`, `os`, `deviceType`, `ip`: String?
- `lastActiveAt`: DateTime (Oxirgi so‘rov vaqti)
- `hashedRefreshToken`: String
- `prevHashedRefreshToken`: String?
- `prevTokenExpiresAt`: DateTime?
- `prevTokenUsed`: Boolean
- `userId`: Int (FK -> User)

#### 4. Category (Mahsulot Toifalari)
- `id`: Int (PK)
- `name`: String
- `storeId`: Int (FK -> Store)
- Unikal cheklov: `[storeId, name]`

#### 5. Product (Mahsulotlar)
- `id`: Int (PK)
- `name`: String
- `barcode`: String? (Shtrix-kod)
- `unit`: String (Standart: "dona", "kg", "metr"...)
- `sellingPrice`: Decimal(15, 2) (Sotish narxi)
- `lastPurchasePrice`: Decimal(15, 2) (Oxirgi kirim/tannarx narxi)
- `stock`: Int (Ombordagi joriy qoldiq soni)
- `minStock`: Int (Minimal qoldiq chegarasi, ogohlantirish uchun)
- `imageUrl`: String? (Rasm yo‘li)
- `isActive`: Boolean (Standart: `true`)
- `storeId`: Int (FK -> Store)
- `categoryId`: Int? (FK -> Category)
- Unikal cheklov: `[storeId, barcode]`

#### 6. Customer (Mijozlar)
- `id`: Int (PK)
- `name`: String (F.I.SH)
- `phone`: String? (Telefon raqami)
- `address`, `notes`: String?
- `storeId`: Int (FK -> Store)

#### 7. Sale (Savdo Boshqaruvi)
- `id`: Int (PK)
- `saleNumber`: Int (Do‘kon bo‘yicha tartib raqami)
- `status`: SaleStatus (`DRAFT`, `CONFIRMED`, `COMPLETED`, `CANCELLED`)
- `paymentType`: PaymentType (`CASH`, `CREDIT`)
- `subtotal`: Decimal(15, 2) (Chegirmasiz jami summa)
- `discountPercent`: Decimal(5, 2) (Chegirma foizi)
- `discountAmount`: Decimal(15, 2) (Chegirma summasi)
- `totalAmount`: Decimal(15, 2) (To‘lanishi kerak bo‘lgan yakuniy summa)
- `deletedAt`: DateTime? (Soft delete)
- `storeId`: Int, `userId`: Int (Kassir), `customerId`: Int?

#### 8. SaleItem (Savdo Tarkibidagi Mahsulotlar)
- `id`: Int (PK)
- `saleId`: Int (FK -> Sale)
- `productId`: Int (FK -> Product)
- `quantity`: Int (Sotilgan miqdor)
- `price`: Decimal(15, 2) (Sotilgan paytdagi narxi)
- `costPrice`: Decimal(15, 2) (Savdo paytidagi tovarning oxirgi kirim narxi / tannarx snapshot'i)
- `total`: Decimal(15, 2) (`quantity * price`)

#### 9. Debt (Nasiyalar / Qarzlar)
- `id`: Int (PK)
- `saleId`: Int (FK -> Sale)
- `customerId`: Int (FK -> Customer)
- `amount`: Decimal(15, 2) (Umumiy qarz summasi)
- `remainingAmount`: Decimal(15, 2) (Qolgan qarz summasi)
- `dueDate`: DateTime? (To‘lashning oxirgi muddati)
- `isPaid`: Boolean (Standart: `false`)
- `deletedAt`: DateTime?
- `storeId`: Int (FK -> Store)

#### 10. DebtPayment (Qarz To‘lovlari Tarixi)
- `id`: Int (PK)
- `debtId`: Int (FK -> Debt)
- `amount`: Decimal(15, 2) (To‘langan summa)
- `note`: String? (Izoh)
- `deletedAt`: DateTime?
- `storeId`: Int (FK -> Store)

#### 11. CashTransaction (Kassa Harakatlari)
- `id`: Int (PK)
- `type`: CashTransactionType (`SALE`, `DEBT_PAYMENT`, `EXPENSE`, `OPENING`, `ADJUSTMENT`)
- `amount`: Decimal(15, 2) (Harakat summasi: musbat yoki manfiy)
- `balance`: Decimal(15, 2) (Harakatdan keyingi kassa qoldig‘i)
- `userId`: Int, `saleId`: Int?, `storeId`: Int

#### 12. ExpenseCategory & Expense (Xarajatlar)
- **ExpenseCategory:** `id`, `name`, `storeId`
- **Expense:** `id`, `amount`: Decimal(15, 2), `note`: String?, `expenseCategoryId`: Int, `userId`: Int, `storeId`: Int, `deletedAt`: DateTime?

#### 13. InventoryTransaction (Ombor Harakatlari Jurnali)
- `id`: Int (PK)
- `type`: InventoryTransactionType (`PURCHASE`, `SALE`, `WRITE_OFF`, `OPENING`, `ADJUSTMENT`)
- `quantity`: Int (Kirim yoki chiqim miqdori)
- `unitPrice`: Decimal(15, 2)? (Kirim qilingan narx)
- `productId`: Int, `storeId`: Int

#### 14. Notification (Xabarnomalar)
- `id`: Int (PK)
- `type`: NotificationType
- `title`: String, `message`: String
- `isRead`: Boolean, `isSent`: Boolean
- `storeId`: Int

---

## 6. Asosiy Biznes Qoidalari va Jarayonlar

### 6.1. Savdo Jarayoni (Checkout)
1. Kassir POS ekranida tovarlarni tanlaydi yoki shtrix-kod orqali qidiradi.
2. Savdo turi belgilanadi:
   - **Naqd savdo (`CASH`):** Kassa balansi `totalAmount` ga oshadi (`CashTransactionType.SALE`).
   - **Nasiya savdo (`CREDIT`):** Mijoz (`Customer`) majburiy tanlanadi. Kassaga pul kirmaydi, avtomatik `Debt` yozuvi ochiladi (`remainingAmount = totalAmount`).
3. Har bir savdo moddasi (`SaleItem`) uchun ushbu tovarning ayni paytdagi `lastPurchasePrice` narxi `costPrice` maydoniga **snapshot** qilib yozib qo‘yiladi.
4. Tovar qoldig‘i kamaytiriladi (`Product.stock -= quantity`) va `InventoryTransactionType.SALE` yoziladi. Zaxira yetarli bo‘lmasa, savdo rad etiladi.
5. Barcha harakatlar yagona Prisma `$transaction` ichida atomar bajariladi.

### 6.2. Foyda va Moliyaviy Hisob-Kitob
Foyda hisobotlari quyidagi buxgalteriya formulalariga tayanadi:
$$\text{Yalpi Tushum (Revenue)} = \sum \text{Sale.totalAmount}$$
$$\text{Tannarx (COGS)} = \sum (\text{SaleItem.quantity} \times \text{SaleItem.costPrice})$$
$$\text{Yalpi Foyda (Gross Profit)} = \text{Revenue} - \text{COGS}$$
$$\text{Sof Foyda (Net Profit)} = \text{Gross Profit} - \sum \text{Expense.amount}$$

### 6.3. Nasiyani Qaytarish (Debt Payment)
1. Mijoz qarzini qisman yoki to‘liq qaytarganda (`POST /debts/:id/pay`):
2. `Debt.remainingAmount` to‘langan summaga kamaytiriladi.
3. Agar `remainingAmount <= 0` bo‘lsa, `isPaid = true` belgilanadi.
4. Kassa balansiga naqd pul kiritiladi (`CashTransactionType.DEBT_PAYMENT`).
5. Do‘kon ma'murlariga Telegram orqali to‘lov haqida chek xabari yuboriladi.

### 6.4. Xarajatlar (Expenses)
- Xarajat kiritilganda (`POST /expenses`), ko‘rsatilgan summa kassa balansidan avtomatik ayiriladi (`CashTransactionType.EXPENSE`, manfiy summa).
- Xarajat toifalari bo‘yicha oylik va oraliq tahlillar yuritiladi.

### 6.5. Telegram Shaxsiy Bildirishnomalari
- **Xabarlarni yetkazish qoidasi:** Bildirishnomalar begona do‘konlarga yoki platforma superadminiga ketmaydi. Tizim har bir do‘konning o‘ziga tegishli, faol va Telegramini ulagan `ADMIN` va `MANAGER`larining shaxsiy Telegram chatiga xabarlarni yo‘naltiradi.
- **Avtomatik Bildirishnomalar:**
  1. *Yangi savdo cheki:* Summa, to‘lov turi, sotuvchi ismi.
  2. *Qarz to‘lovi:* Mijoz ismi, to‘langan summa, qolgan qarz.
  3. *Kam qolgan tovarlar:* `stock <= minStock` bo‘lgan mahsulotlar ro‘yxati.
  4. *Muddati o‘tgan qarzlar:* Bugungi kunda to‘lanishi kerak bo‘lgan qarzdorlar eslatmasi.
  5. *Kunlik hisobot (Daily Summary):* Kunlik tushum, kassa qoldig‘i, sof foyda va xarajatlar yakuni.

---

## 7. Media Fayllar Bilan Ishlash (Sharp)

- Barcha rasm yuklash so‘rovlari (`/users/me/image`, `/products/:id/image`) `ImageValidationPipe` orqali tekshiriladi.
- Qabul qilinuvchi formatlar: `jpg`, `jpeg`, `png`, `webp`, `heic`.
- Maksimal fayl hajmi: 10 MB.
- **Optimizatsiya:** `Sharp` kutubxonasi yordamida rasm avtomatik `1600x1600` pikselli chegaraga keltiriladi, 80% sifat bilan siqiladi va zamonaviy **`.webp`** formatida diskka saqlanadi.
- Eskirgan yoki o‘chirilgan mahsulot/avatar rasmlari disk xotirasidan darhol o‘chiriladi (`File.delete`).

---

## 8. API Kontrakti va Standartlar

### 8.1. API Prefiksi va Hujjatlar
- Bazaviy manzil: `/api/v1`
- Swagger interfeysi: `/api/v1/docs`
- Swagger JSON sxemasi: `/api/v1/docs-json`

### 8.2. Standart Muvaffaqiyat Javobi
Barcha kontrollerlar `successRes(data, statusCode)` orqali javob qaytaradi:
```json
{
  "statusCode": 200,
  "data": { ... }
}
```
Ro‘yxatlar uchun javob formati:
```json
{
  "statusCode": 200,
  "data": {
    "items": [ ... ],
    "meta": {
      "page": 1,
      "limit": 20,
      "total": 145,
      "totalPages": 8
    }
  }
}
```

### 8.3. Standart Xatolik Javobi
Barcha kutilgan va kutilmagan xatoliklar `AllExceptionsFilter` orqali ushlanadi:
```json
{
  "statusCode": 400,
  "code": "VALIDATION_ERROR",
  "message": "Telefon raqam noto'g'ri formatda",
  "data": null,
  "timestamp": "2026-09-23T10:00:00.000Z",
  "path": "/api/v1/auth/signin"
}
```
Xatolik kodlari qat'iy ravishda `SCREAMING_SNAKE_CASE` standartida bo‘ladi (`INVALID_CREDENTIALS`, `OTP_INVALID`, `DEVICE_LIMIT_REACHED`, `PRODUCT_NOT_FOUND` va h.k.).

---

## 9. Frontend Standartlari va Foydalanuvchi Interfeysi

### 9.1. Sahifalar va Funksional Bo‘limlar
1. **Kirish & Autentifikatsiya:**
   - Telefon raqam va parol kiritish;
   - Telegramga yuborilgan 6 xonali OTP kodni kiritish oynasi (taymer, avtomatik keyingi katakka o‘tish);
   - Telegram hisobini ulash ekrani;
   - Parolni tiklash oqimi;
   - Qurilmalar sessiyalari ro‘yxati va ortiqcha qurilmalarni chiqarib yuborish.
2. **POS (Kassa / Sotuv ekrani):**
   - Shtrix-kod skaneri va tovar qidiruvi;
   - Tezkor savat, sonini o‘zgartirish, chegirma qo‘llash;
   - Naqd yoki Nasiya to‘lovini tanlash;
   - Sotuv yakunida chek chiqarish (print) oynasi.
3. **Ombor va Mahsulotlar:**
   - Mahsulotlar katalogi, qidiruv, toifalar bo‘yicha filtr;
   - Yangi tovar qo‘shish / tahrirlash dialogi, rasm yuklash;
   - Tovar kirimi (Kirim hujjati / Purchase), hisobdan chiqarish (Spisanie) va inventarizatsiya.
4. **Nasiyalar (Qarzlar daftari):**
   - Qarzdor mijozlar ro‘yxati, qarz summasi va to‘lov muddati;
   - To‘lov muddati o‘tgan qarzlarni alohida qizil belgilash;
   - Qarz to‘lovini qabul qilish modal oynasi.
5. **Kassa va Xarajatlar:**
   - Kassadagi joriy naqd pul qoldig‘i kartochkasi;
   - Barcha kirim-chiqim operatsiyalari jurnali;
   - Do‘kon xarajatlarini qayd qilish.
6. **Tahliliy Hisobotlar:**
   - Kunlik, oylik va tanlangan oraliq bo‘yicha diagrammalar;
   - Tushum, tannarx, xarajatlar va sof foyda hisobi;
   - Eng ko‘p sotilgan tovarlar reytingi.
7. **Xodimlar va Do‘kon Sozlamalari:**
   - Xodimlarni boshqarish (Admin, Menejer, Sotuvchi rollarini tayinlash);
   - Shaxsiy profil, Telegramni biriktirish / qayta ulash;
   - Do‘kon ma'lumotlarini tahrirlash;
   - Superadmin uchun barcha do‘konlar monitoringi va onboarding.

---

## 10. Sifat Nazorati va Testlar

Loyiha barqarorligi avtomatlashtirilgan testlar orqali ta'minlanadi:
1. **Backend E2E Testlar (Jest):**
   - 9 ta test to‘plami, **132 ta e2e testlar** (Auth, OTP, Devices, Swagger kontrakti, Savdo, Qarzlar, Xarajatlar, Kassa, Telegram integratsiyasi).
   - Testlar alohida izolyatsiyalangan test ma'lumotlar bazasida ishlaydi.
2. **Frontend Testlar (Vitest):**
   - 10 ta test fayli, **172 ta birlik testlar** (Rollar gardi, ruxsatlar tekshiruvi, formatlash, dizayn tokenlari, login va OTP oqimi).
3. **Type-Safety:**
   - Backend `nest build` va Frontend `tsc -b` orqali to‘liq xatosiz kompilyatsiya qilinadi.

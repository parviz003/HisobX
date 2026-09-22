# HisobX — Mini Magazin Management System (SaaS)

Kichik va o‘rta magazinlar uchun sodda, universal, yuqori xavfsizlikka ega va ko'p foydalanuvchili (Multi-tenant SaaS) boshqaruv tizimi.

Tizim magazindagi **mahsulotlar, ombor, savdo, nasiya, mijoz qarzi, kassa, xarajatlar, hisobotlar va sessiyalar/qurilmalarni** yagona joyda boshqarish uchun mo‘ljallangan.

Loyiha arxitekturasi va kod yozish uslubi to'liq **Marketplace** standarti asosida: qatlamli monolit (Layered Modular Monolith), Cookie-based JWT, qurilmalar (device tracking) sessiyasi, Redis OTP, Sharp orqali media optimizatsiyasi hamda Telegram xatoliklar log tizimi bilan quriladi.

---

## 1. Maqsad

Loyiha magazin egasiga quyidagi savollarga tez va aniq javob berish imkonini beradi:
- Bugun qancha savdo bo‘ldi?
- Bugun qancha sof foyda qilindi?
- Kassada qancha pul bor?
- Kim qancha qarzdor va qaysi qarzlarning muddati o‘tgan?
- Omborda qancha mahsulot bor va qaysilari tugayapti?
- Qancha xarajat qilindi va oylik natija qanday?
- Do'kon hisobiga qaysi qurilmalardan kirilgan va sessiyalar xavfsizligi qanday?

---

## 2. Texnologiyalar steki

### Backend
- **Framework:** NestJS 11+ (TypeScript, Express)
- **Paket menejeri:** pnpm
- **Ma'lumotlar bazasi:** PostgreSQL
- **ORM & Driver:** Prisma 7 (`@prisma/adapter-pg` driver adapteri bilan)
- **Kesh & Vaqtinchalik xotira:** Redis (`ioredis`) — OTP, limitlar, cooldown uchun
- **Autentifikatsiya & Xavfsizlik:** 
  - `httpOnly` Cookies (Access & Refresh tokenlar)
  - `bcrypt` parol va tokenlarni xeshlash
  - `helmet` xavfsizlik headerlari
  - `device-detector-js` qurilmalarni nazorat qilish
- **Media & Fayllar:**
  - `multer` (fayl qabul qilish)
  - `sharp` (rasmlarni avtomatik siqish, hajmini kamaytirish va `.webp` formatga o'tkazish)
- **Bildirishnomalar & Integratsiyalar:**
  - Telegram Bot API (xatoliklarni guruhga tashlash uchun `LoggerBot` va do'kon xabarnomalari)
  - Local OTP SMS/Email simulator (kodlar konsol/response orqali uzatiladi)
  - Nodemailer / `@nestjs-modules/mailer` (pochta xabarlari uchun)
- **API Hujjatlashtirish:** Swagger (`@nestjs/swagger`)

---

## 3. Loyiha arxitekturasi va fayllar strukturasi

Loyiha **Marketplace** arxitektura standartiga 1:1 muvofiq quyidagi qatlamlarda joylashadi:

```text
src/
├── main.ts                    # Bootstrap entry-point: faqat App.main() chaqiradi
├── app.service.ts             # App bootstrap klassi (CORS, Helmet, Cookie-parser, Pipes, Swagger)
├── app.module.ts              # Asosiy ildiz moduli
├── config/                    # Global konfiguratsiyalar
│   ├── index.ts               # dotenv orqali markazlashgan env obyekti
│   ├── database/              # prisma.module.ts, prisma.service.ts (@prisma/adapter-pg)
│   └── redis/                 # redis.module.ts, redis.service.ts (ioredis)
├── infrastructure/            # Yordamchi servislar va tashqi adapterlar (Statik classlar)
│   └── lib/                   
│       ├── Crypt.ts           # bcrypt.hash, compare
│       ├── Token.ts           # JWT sign, verify, cookie set/clear
│       └── File.ts            # Rasmlarni saqlash va o'chirish
├── common/                    # Barcha modullar uchun umumiy utility va mexanizmlar
│   ├── bot/                   # logger-bot.ts (Telegram orqali 400/500 xatoliklarini log qilish)
│   ├── decorator/             # @UserId, @CurrentUser, @RefreshToken, @AccessRoles
│   ├── enum/                  # Roles, Status, Transaction types
│   ├── filter/                # all-exception.filter.ts (barcha xatoliklarni tutib log qiluvchi filter)
│   ├── guard/                 # jwt-auth.guard.ts (cookie-based), roles.guard.ts (RBAC)
│   ├── helper/                # success-response.ts (successRes), device-info.ts
│   ├── interface/             # IPayload, IToken, ISuccess
│   └── pipe/                  # image-validation.pipe.ts (Sharp bilan .webp ga aylantiruvchi pipe)
└── modules/                   # Tizimning asosiy biznes modullari
    ├── auth/                  # SignIn, OTP confirm, Refresh, SignOut, Devices boshqaruvi
    ├── otp/                   # Redis asosidagi OTP generatsiya va tekshirish
    ├── users/                 # Foydalanuvchilar (Admin / Seller) boshqaruvi
    ├── stores/                # Do'kon ma'lumotlari (SaaS tenant)
    ├── categories/            # Mahsulot toifalari
    ├── products/              # Mahsulotlar katalogi (rasm yuklash bilan)
    ├── inventory/             # Ombor harakatlari (Kirim, Chiqim, Qoldiq)
    ├── sales/                 # Savdo (Naqd, Nasiya, Chegirmalar)
    ├── customers/             # Mijozlar bazasi
    ├── debts/                 # Qarzlar va bo'lib to'lash (DebtPayments)
    ├── cash/                  # Kassa operatsiyalari va balansi
    ├── expenses/              # Magazin xarajatlari
    ├── reports/               # Foyda va savdo hisobotlari
    └── telegram/              # Do'kon egasiga xabarnomalar yuboruvchi bot
```

---

## 4. Xavfsizlik va Autentifikatsiya qoidalari

1. **Cookie-based JWT:**
   - Access token va Refresh token mijozga JSON ko'rinishida berilmaydi, balki xavfsiz `httpOnly`, `sameSite` cookie sifatida yoziladi.
   - `AuthGuard` tokenni to'g'ridan-to'g'ri `req.cookies?.accessToken` dan o'qiydi.
2. **Qurilmalar (Devices) va Sessiya boshqaruvi:**
   - Har bir foydalanuvchi tizimga kirganida uning brauzeri va operatsion tizimi `device-detector-js` orqali aniqlanadi.
   - Har bir do'kon hisobiga ulanuvchi qurilmalar soni cheklanadi (masalan, 2-3 ta).
   - Sessiya refresh tokeni bazada `hashedRefreshToken` shaklida saqlanadi.
   - Boshqa eski qurilmalarni o'chirish uchun xavfsizlik vaqti (24 soat) talab etiladi.
3. **Redis OTP (2FA):**
   - Tizimga kirish yoki parolni tiklashda 6 xonali OTP kod `crypto.createHmac('sha256')` orqali xeshlanadi va Redis'da saqlanadi.
   - Qayta yuborish (Resend Cooldown - 60s), urinishlar limiti (Attempts - 3 ta) va amal qilish muddati (TTL - 120s) qat'iy nazorat qilinadi.
4. **Xatoliklar monitori (`AllExceptionsFilter` + `LoggerBot`):**
   - Tizimda yuz bergan har bir 400 (Bad Request) va 500 (Internal Server Error) xatoligi Telegram bot orqali dasturchi/administrator guruhiga to'liq stack trace bilan yuboriladi.

---

## 5. Media va Rasmlar boshqaruvi (`Sharp`)

- Mahsulot rasmlari va foydalanuvchi avatarlari yuklanganda `ImageValidationPipe` orqali o'tadi.
- Rasm hajmi tekshiriladi (maksimal 10 MB), avtomatik `1600x1600` o'lchamga moslanadi, sifati 80% qilib siqiladi va **`.webp`** formatga o'tkazilib, diskka saqlanadi (`File.create`).
- Mahsulot yoki foydalanuvchi o'chirilganda/yangilanganda eski rasm diskdan tozalab tashlanadi (`File.delete`).

---

## 6. Response formati

Barcha muvaffaqiyatli kontroller javoblari `successRes` funksiyasi orqali yagona formatda qaytariladi:
```json
{
  "statusCode": 200,
  "data": { ... }
}
```

---

## 7. Database Entitylari (Prisma)

Barcha do'konga oid jadvallarda `storeId` mavjud bo'lib, SaaS multi-tenancy ta'minlanadi.

1. **Store:** Do'kon ma'lumotlari (`id`, `name`, `phone`, `address`, `telegramChatId`, `isActive`).
2. **User:** Do'kon xodimlari (`id`, `phone`, `hashedPassword`, `fullName`, `imageUrl`, `role`: `SUPERADMIN`, `ADMIN`, `SELLER`, `status`: `ACTIVE`, `INACTIVE`, `storeId`).
3. **Devices:** Foydalanuvchining qurilmalari (`deviceId`, `device`, `hashedRefreshToken`, `userId`).
4. **Category:** Mahsulot toifalari (`id`, `name`, `storeId`).
5. **Product:** Mahsulotlar (`id`, `name`, `barcode`, `imageUrl`, `unit`, `sellingPrice`, `lastPurchasePrice`, `stock`, `minStock`, `isActive`, `categoryId`, `storeId`).
6. **Customer:** Mijozlar ro'yxati (`id`, `name`, `phone`, `address`, `notes`, `storeId`).
7. **Sale:** Savdo (`id`, `saleNumber`, `status`: `DRAFT`, `CONFIRMED`, `COMPLETED`, `CANCELLED`, `paymentType`: `CASH`, `CREDIT`, `subtotal`, `discountPercent`, `discountAmount`, `totalAmount`, `userId`, `customerId`, `storeId`).
8. **SaleItem:** Savdo tarkibi (`id`, `saleId`, `productId`, `quantity`, `price`, `costPrice`, `total`).
9. **Debt:** Qarzlar (`id`, `saleId`, `customerId`, `amount`, `remainingAmount`, `dueDate`, `isPaid`, `storeId`).
10. **DebtPayment:** Qarz to'lovlari tarixi (`id`, `debtId`, `amount`, `note`, `storeId`).
11. **CashTransaction:** Kassa harakati (`id`, `type`: `SALE`, `DEBT_PAYMENT`, `EXPENSE`, `OPENING`, `ADJUSTMENT`, `amount`, `balance`, `userId`, `saleId`, `storeId`).
12. **ExpenseCategory:** Xarajat turlari (`id`, `name`, `storeId`).
13. **Expense:** Magazin xarajatlari (`id`, `amount`, `note`, `expenseCategoryId`, `userId`, `storeId`).
14. **InventoryTransaction:** Ombor harakati (`id`, `type`: `PURCHASE`, `SALE`, `WRITE_OFF`, `OPENING`, `ADJUSTMENT`, `productId`, `quantity`, `unitPrice`, `storeId`).
15. **Notification:** Xabarnomalar jurnali (`id`, `type`, `title`, `message`, `isRead`, `storeId`).

---

## 8. Asosiy Biznes Qoidalari va Foyda hisoblash

1. **Foyda hisoblash:**
   $$\text{COGS} = \text{Quantity} \times \text{SaleItem.costPrice}$$
   $$\text{Gross Profit} = \text{Revenue} - \text{COGS}$$
   $$\text{Net Profit} = \text{Gross Profit} - \text{Expenses}$$
   `SaleItem.costPrice` savdo amalga oshirilgan paytdagi mahsulotning `lastPurchasePrice` snapshot'ini saqlaydi.
2. **Qarz va Savdo aloqasi:** Nasiya savdolar faqat mavjud `Customer` bilan amalga oshiriladi va avtomatik `Debt` yozuvini shakllantiradi.
3. **Kassa balansi:** Har bir naqd savdo va qarz to'lovi kassa balansini oshiradi, har bir xarajat esa balansni kamaytiradi.
4. **Zaxira manfiy bo'lmasligi:** Mahsulot zaxirasi yetarli bo'lmaganda savdo yoki hisobdan chiqarish rad etiladi.
5. **Tranzaksion butunlik:** Savdo, qarz to'lash va ombor harakatlari doimo Prisma `$transaction` ichida yopiq holda bajariladi.

---

## 9. Rollar va Ruxsatlar

- **SUPERADMIN:** Tizim platformasi egasi, yangi do'konlar ochish va umumiy texnik nazorat.
- **ADMIN (Do'kon egasi):** Do'kondagi barcha amallar: mahsulotlar, narxlar, ombor, xodimlar, kassa, xarajatlar, hisobotlar.
- **SELLER (Sotuvchi):** Savdo qilish (naqd/nasiya), mahsulotlarni ko'rish, qarz to'lovlarini qabul qilish.

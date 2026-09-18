# UNIVERSAL MAGAZIN BOSHQARUV TIZIMI

## FINAL TEXNIK TOPSHIRIQ (TZ)

---

# 1. LOYIHA HAQIDA

Loyiha kichik va o‘rta magazinlarni avtomatlashtirish uchun mo‘ljallangan **SaaS asosidagi universal magazin boshqaruv tizimi** hisoblanadi.

Tizim CRM bilan cheklanmaydi. Uning asosiy vazifasi magazinning:

* tovar kirimi va chiqimi;
* ombor qoldig‘i;
* naqd savdo;
* nasiya savdo;
* mijoz qarzdorligi;
* pul harakati;
* kassa;
* xarajatlar;
* kunlik va oylik hisobotlar;
* biznes tahlili;
* foydalanuvchilar va huquqlari

kabi jarayonlarini yagona tizim orqali boshqarishdir.

Tizim **universal va moslashuvchan** bo‘lishi kerak. Ya'ni tizim ma'lum bir magazin turiga qattiq bog‘lanmaydi. Admin panel orqali magazinning faoliyatiga qarab asosiy sozlamalarni o‘zgartirish mumkin bo‘ladi.

Masalan:

* kiyim-kechak magazini;
* oziq-ovqat magazini;
* qurilish mollari magazini;
* maishiy texnika magazini;
* oboy magazini;
* xo‘jalik mollari magazini.

---

# 2. LOYIHA MODELI

## 2.1. SaaS

Tizim **Multi-Tenant SaaS** modelida ishlaydi.

Bitta platformada bir nechta mustaqil magazin ishlashi mumkin.

```text
Platform
│
├── Tenant A
│   ├── Users
│   ├── Products
│   ├── Warehouse
│   ├── Sales
│   ├── Customers
│   ├── Debts
│   ├── Cashbox
│   └── Reports
│
├── Tenant B
│   ├── Users
│   ├── Products
│   ├── Warehouse
│   ├── Sales
│   └── ...
│
└── Tenant C
```

### Tenant Isolation

Har bir tenant ma'lumotlari qat'iy ajratiladi.

Bir tenant foydalanuvchisi boshqa tenantning:

* mahsulotlari;
* savdolari;
* mijozlari;
* qarzlari;
* kassasi;
* hisobotlari;
* foydalanuvchilari

haqidagi ma'lumotlarni ko‘ra olmaydi.

---

# 3. FILIALLAR

MVP versiyada majburiy filial tizimi bo‘lmaydi.

Boshlang‘ich struktura:

```text
Tenant
   └── Warehouse
```

Lekin arxitektura kelajakda filial qo‘shishga mos bo‘lishi kerak:

```text
Tenant
   ├── Branch
   │    └── Warehouse
   └── Branch
        └── Warehouse
```

MVP’da bitta tenant bir yoki bir nechta omborga ega bo‘lishi mumkin.

---

# 4. FOYDALANUVCHI ROLLARI

## 4.1. SUPER_ADMIN

SaaS platforma administratori.

Huquqlari:

* tenant yaratish;
* tenantlarni boshqarish;
* subscription boshqarish;
* tariflarni boshqarish;
* platforma statistikasi;
* global tizim sozlamalari.

---

## 4.2. ADMIN

Magazin administratori.

Huquqlari:

* mahsulotlar;
* kategoriyalar;
* o‘lchov birliklari;
* omborlar;
* foydalanuvchilar;
* rollar;
* permissions;
* kassa;
* savdo sozlamalari;
* nasiya sozlamalari;
* notification sozlamalari;
* umumiy magazin konfiguratsiyasi.

---

## 4.3. OWNER / DIRECTOR

Biznes egasi yoki direktori.

Huquqlari:

* Dashboard;
* savdo;
* foyda;
* qarzdorlik;
* pul harakati;
* xarajatlar;
* ombor;
* hisobotlar;
* analytics.

---

## 4.4. SELLER / CASHIER

Huquqlari:

* savdo yaratish;
* to‘lov qabul qilish;
* mijoz tanlash;
* nasiya savdo qilish;
* qarz to‘lovi qabul qilish;
* ruxsat berilgan qaytarishlarni bajarish.

---

## 4.5. STOREKEEPER

Huquqlari:

* tovar kirimi;
* ombor nazorati;
* inventory;
* transfer;
* write-off;
* stock adjustment.

---

# 5. ROLE VA PERMISSION TIZIMI

Role mavjudligi avtomatik ravishda barcha huquqlarni bermaydi.

Permissionlar alohida boshqariladi.

Masalan:

```text
product:create
product:update
product:delete

sale:create
sale:return

debt:payment

expense:create

report:view
analytics:view
```

Admin ruxsatlarni rollarga biriktiradi.

Kelajakda yangi role yaratish mumkin bo‘ladi.

---

# 6. AUTHENTICATION

Backend authentication quyidagi texnologiyalar asosida quriladi:

* JWT;
* Access Token;
* Refresh Token;
* bcrypt;
* Guards;
* Permission Guards;
* Helmet;
* DTO validation;
* Rate Limiting.

## Login flow

```text
Login
  ↓
Access Token
  +
Refresh Token
  ↓
API Requests
```

Refresh token rotation qo‘llanadi.

Logout vaqtida refresh token invalid qilinadi.

Password hech qachon plain text holatda saqlanmaydi.

---

# 7. MAGAZIN SOZLAMALARI

Har bir tenant uchun:

* magazin nomi;
* logo;
* telefon;
* manzil;
* valyuta;
* vaqt zonasi;
* omborlar;
* kassalar;
* savdo sozlamalari;
* nasiya sozlamalari;
* notification sozlamalari.

---

# 8. UNIVERSAL PRODUCT TIZIMI

Mahsulot quyidagi asosiy ma'lumotlarni saqlaydi:

* ID;
* nom;
* SKU;
* barcode;
* kategoriya;
* birlik;
* brand;
* sotuv narxi;
* oxirgi xarid narxi;
* minimal qoldiq;
* aktiv/passiv status;
* rasm;
* tavsif.

---

# 9. CUSTOM PRODUCT ATTRIBUTES

Tizim ma'lum bir mahsulot turiga qattiq bog‘lanmasligi kerak.

Admin custom attribute yaratishi mumkin.

Masalan:

```text
Rang
Razmer
Material
Hajm
Model
Ishlab chiqaruvchi
```

Misol:

```text
Product: Futbolka

Color: Black
Size: XL
Material: Cotton
```

Boshqa magazinda:

```text
Product: Oboy

Color: Beige
Collection: Premium
Pattern: Floral
```

Shu orqali tizim universal bo‘ladi.

---

# 10. KATEGORIYALAR

Admin kategoriya yaratishi, o‘zgartirishi va aktiv/passiv qilishi mumkin.

Misol:

```text
Elektronika
Kiyim
Oziq-ovqat
Qurilish
Oboy
Maishiy texnika
```

---

# 11. O‘LCHOV BIRLIKLARI

Tizimda default birliklar:

```text
dona
kg
g
metr
litr
quti
rulon
komplekt
```

Admin yangi birlik yaratishi mumkin.

---

# 12. NARXLAR TIZIMI

Mahsulotda:

```text
salePrice
lastPurchasePrice
```

saqlanadi.

Tannarxni hisoblashda **oxirgi xarid narxi** ishlatiladi.

---

# 13. COST PRICE SNAPSHOT

Eng muhim business rule:

Savdo vaqtida mahsulotning o‘sha paytdagi oxirgi xarid narxi `SaleItem` ichida alohida saqlanadi.

Masalan:

```text
Yanvar:

Purchase Price = 100 000
Sale Price = 130 000
```

Keyinchalik:

```text
Fevral:

Purchase Price = 115 000
```

Fevraldagi savdoda:

```text
costPriceSnapshot = 115 000
```

Yanvardagi eski savdoda esa:

```text
costPriceSnapshot = 100 000
```

bo‘lib qoladi.

Shuning uchun keyingi xarid narxi oldingi hisobotlarni buzmaydi.

---

# 14. FOYDA HISOBLASH

```text
Revenue = Sale Revenue
```

```text
COGS = Quantity × costPriceSnapshot
```

```text
Gross Profit = Revenue - COGS
```

Net profit hisobida biznes xarajatlari ham hisobga olinadi:

```text
Net Profit =
Gross Profit - Expenses
```

---

# 15. WAREHOUSE

Ombor tizimning markaziy qismlaridan biridir.

Asosiy oqim:

```text
Purchase
   ↓
Inventory IN
   ↓
Stock
   ↓
Sale
   ↓
Inventory OUT
```

---

# 16. INVENTORY TRANSACTION

Har bir tovar harakati alohida ledger sifatida saqlanadi.

Transaction turlari:

```text
PURCHASE
SALE
RETURN
TRANSFER_IN
TRANSFER_OUT
WRITE_OFF
ADJUSTMENT
OPENING_BALANCE
```

Misol:

```text
+100 Purchase
-5 Sale
-2 Sale
+1 Return
-10 Write-off
```

Current Stock avtomatik hisoblanadi.

---

# 17. BOSHLANG‘ICH QOLDIQ

Tizimni mavjud magazinga joriy qilish uchun **Opening Balance** mexanizmi bo‘ladi.

## Boshlang‘ich tovar qoldig‘i

Masalan:

```text
Product A = 500 dona
Product B = 100 dona
Product C = 25 dona
```

Bu `OPENING_BALANCE` inventory transaction sifatida saqlanadi.

## Boshlang‘ich kassa

Masalan:

```text
Initial Cash = 10 000 000 so‘m
```

Bu ham alohida opening cash transaction sifatida saqlanadi.

Opening balance operatsiyalarini faqat ruxsat berilgan foydalanuvchi bajarishi mumkin.

---

# 18. SAVDO MODULI

Sale quyidagilarni o‘z ichiga oladi:

* customer;
* seller;
* warehouse;
* sale items;
* payment;
* discount;
* total;
* status;
* sana.

---

# 19. SAVDO STATUSLARI

Sale lifecycle:

```text
DRAFT
   ↓
CONFIRMED
   ↓
COMPLETED
```

Kerak bo‘lsa:

```text
CANCELLED
```

### Mazmuni

**DRAFT** — hali yakunlanmagan savdo.

**CONFIRMED** — savdo tasdiqlangan.

**COMPLETED** — barcha kerakli operatsiyalar muvaffaqiyatli bajarilgan.

**CANCELLED** — savdo bekor qilingan.

Yakunlangan moliyaviy transactionlar oddiy delete orqali o‘chirilmaydi.

---

# 20. TO‘LOV TURLARI

Tizim quyidagi payment type’larni qo‘llaydi:

```text
CASH
CARD
TRANSFER
CREDIT
MIXED
```

Masalan:

```text
Total = 1 000 000

Cash = 600 000
Credit = 400 000
```

---

# 21. CHEGIRMA

MVP’da chegirma **faqat foiz ko‘rinishida** beriladi.

Masalan:

```text
Discount = 10%
```

Hisoblash:

```text
Discount Amount =
Subtotal × Discount Percentage / 100
```

Admin kerak bo‘lsa:

* kassir uchun maksimal discount foizini;
* boshqa rollar uchun discount limitini

permission/configuration orqali belgilashi mumkin.

---

# 22. NAQD SAVDO

Naqd savdo yakunlanganda:

```text
Sale
 ↓
SaleItems
 ↓
Inventory OUT
 ↓
Payment
 ↓
CashTransaction
 ↓
Completed
```

Bu operatsiyalar database transaction ichida bajariladi.

Agar bir qismida xato yuz bersa, transaction rollback qilinadi.

---

# 23. NASIYA SAVDO

Credit sale quyidagilar bilan bog‘lanadi:

```text
Customer
Sale
Debt
DebtPayment
```

Misol:

```text
Sale       = 5 000 000
Paid       = 2 000 000
Remaining  = 3 000 000
```

---

# 24. NASIYA STATUSLARI

```text
ACTIVE
PARTIALLY_PAID
PAID
OVERDUE
CANCELLED
```

Qisman to‘lov qilish mumkin.

Masalan:

```text
Debt = 3 000 000

Payment 1 = 1 000 000
Remaining = 2 000 000

Payment 2 = 500 000
Remaining = 1 500 000
```

---

# 25. NASIYA MUDDATI VA ESLATMA

Credit sale uchun:

* due date;
* reminder configuration;
* overdue status

mavjud bo‘ladi.

Misol:

```text
Due date: 20.09.2026

19.09 → Reminder
20.09 → Due notification
21.09 → Overdue notification
```

---

# 26. CUSTOMER

Customer ma'lumotlari:

* ID;
* ism;
* telefon;
* manzil;
* izoh;
* qarzdorlik;
* xarid tarixi;
* to‘lov tarixi;
* return tarixi.

Customer dashboard:

```text
Total Purchased
Total Paid
Outstanding Debt
Last Purchase
```

---

# 27. QAYTARISH

Sale return:

* full return;
* partial return.

Har bir return original Sale bilan bog‘lanadi.

Return vaqtida:

```text
Inventory ↑
Revenue adjustment
Payment adjustment
Debt adjustment
```

amalga oshiriladi.

Return ham audit logga tushadi.

---

# 28. CASHBOX

Cashbox magazindagi barcha pul harakatlarini boshqaradi.

## Pul kirimi

```text
SALE
DEBT_PAYMENT
OTHER_INCOME
OPENING_BALANCE
```

## Pul chiqimi

```text
EXPENSE
SUPPLIER_PAYMENT
WITHDRAWAL
OTHER_EXPENSE
```

Har bir cash transaction:

* amount;
* type;
* source;
* cashbox;
* user;
* date;
* description

ma'lumotlarini saqlaydi.

---

# 29. EXPENSE

Xarajat kategoriyalari:

```text
RENT
SALARY
TRANSPORT
ELECTRICITY
INTERNET
ADVERTISEMENT
REPAIR
TAX
OTHER
```

Admin custom expense category yaratishi mumkin.

---

# 30. SUPPLIER

Supplier:

* name;
* phone;
* contact;
* purchases;
* payments;
* debt.

Supplier ma'lumotlari keyingi xarid jarayonlari bilan bog‘lanadi.

---

# 31. PURCHASE

Purchase orqali omborga tovar kiritiladi.

Purchase tarkibi:

* supplier;
* warehouse;
* product;
* quantity;
* purchase price;
* total;
* date;
* user.

Purchase yakunlanganda:

```text
Purchase
 ↓
Inventory IN
 ↓
Update Last Purchase Price
```

---

# 32. BUSINESS ANALYTICS

Dashboardda asosiy KPIlar:

```text
Revenue
COGS
Gross Profit
Net Profit
Average Check
Total Sales
Total Customers
Outstanding Debt
Expenses
Stock Value
```

---

# 33. PRODUCT ANALYTICS

Tizim quyidagilarni ko‘rsatadi:

* eng ko‘p sotilgan mahsulotlar;
* eng ko‘p foyda bergan mahsulotlar;
* kam sotilayotgan mahsulotlar;
* minimal qoldiqqa tushgan mahsulotlar.

---

# 34. CUSTOMER ANALYTICS

Quyidagilar ko‘rsatiladi:

* eng ko‘p xarid qilgan mijozlar;
* eng katta qarzdor mijozlar;
* overdue mijozlar;
* xaridlar tarixi.

---

# 35. DAILY REPORT

Kunlik hisobot:

```text
Total Sales
Cash Sales
Card Sales
Transfer Sales
Credit Sales
Returns
Debt Payments
Expenses
Revenue
COGS
Gross Profit
Net Profit
Cash Flow
```

---

# 36. MONTHLY REPORT

Oylik hisobot:

```text
Revenue
COGS
Gross Profit
Expenses
Net Profit
Credit Sales
Debt Payments
Outstanding Debt
Cash Flow
Stock Value
```

---

# 37. CASH FLOW

Asosiy ko‘rsatkich:

```text
Net Cash Flow =
Cash In - Cash Out
```

Hisobotda pul kirimi va chiqimi manbalari alohida ko‘rsatiladi.

---

# 38. STOCK REPORT

Ombor hisobotlari:

```text
Current Stock
Stock Movement
Purchases
Sales
Returns
Write-offs
Adjustments
Opening Balance
```

---

# 39. DASHBOARD

## OWNER / DIRECTOR

Dashboard:

```text
Today Revenue
Today Profit
Today Expenses
Outstanding Debt
Cash Balance
Stock Value
Total Sales
Credit Sales
```

Grafiklar:

```text
Sales Trend
Profit Trend
Expense Trend
Debt Trend
```

---

## CASHIER

```text
Today Sales
Today Cash
Credit Sales
Recent Transactions
```

---

## STOREKEEPER

```text
Current Stock
Low Stock
Purchases
Transfers
Inventory Alerts
```

---

# 40. NOTIFICATION SYSTEM

Notification arxitekturasi:

```text
NestJS
   ↓
Notification Service
   ├── Socket.IO
   └── Telegram Bot
```

Redis va BullMQ yordamida background/scheduled jobs ishlatiladi.

---

# 41. SOCKET.IO

Web panelda real-time notification uchun ishlatiladi.

Masalan:

```text
Low Stock
New Sale
Debt Payment
New Credit Sale
System Alert
```

---

# 42. TELEGRAM BOT

Telegram tashqi notificationning asosiy kanali bo‘ladi.

Notificationlar:

* nasiya yaratildi;
* qarz muddati yaqinlashdi;
* qarz muddati o‘tdi;
* low stock;
* kunlik hisobot;
* oylik hisobot;
* muhim system alert.

Misol:

```text
🔔 Qarzdorlik eslatmasi

Mijoz: Ali Valiyev
Qarz: 1 500 000 so‘m
Muddat: 20.09.2026
```

---

# 43. TELEGRAM ACCOUNT LINKING

User o‘z tizim accountini Telegram accounti bilan bog‘laydi.

Shundan keyin notificationlar tegishli Telegram accountga yuboriladi.

---

# 44. BULLMQ

BullMQ scheduled/background vazifalar uchun ishlatiladi.

Masalan:

```text
Debt Reminder
Daily Report
Monthly Report
Low Stock Check
Notification Queue
```

---

# 45. REDIS

Redis quyidagi vazifalar uchun ishlatiladi:

* BullMQ;
* cache;
* real-time infrastructure;
* rate limiting;
* temporary data;
* pub/sub.

---

# 46. AUDIT LOG

Muhim barcha operatsiyalar audit qilinadi.

Masalan:

```text
LOGIN
LOGOUT
CREATE
UPDATE
DELETE
SALE
RETURN
PAYMENT
EXPENSE
STOCK_ADJUSTMENT
SETTINGS_CHANGE
PERMISSION_CHANGE
OPENING_BALANCE
```

Audit logda:

```text
User
Action
Entity
EntityId
OldData
NewData
Timestamp
IP
```

kabi ma'lumotlar saqlanishi mumkin.

---

# 47. SOFT DELETE

Quyidagi entitylarda soft delete ishlatiladi:

* Product;
* Category;
* Customer;
* Supplier;
* User;
* Warehouse;
* Expense Category.

Masalan:

```text
deletedAt = null
```

yoki

```text
deletedAt = timestamp
```

Financial va inventory transactionlar hard delete qilinmaydi.

---

# 48. DATABASE ASOSIY ENTITYLARI

```text
Tenant

User
Role
Permission

Product
ProductAttribute
ProductAttributeValue
Category
Unit

Warehouse
InventoryTransaction

Supplier
Purchase
PurchaseItem

Customer

Sale
SaleItem
Return
ReturnItem

Payment

Debt
DebtPayment

Cashbox
CashTransaction

Expense
ExpenseCategory

Notification
NotificationPreference
TelegramAccount

AuditLog

Setting

Subscription
Plan
Invoice
```

---

# 49. SUBSCRIPTION

Tizim SaaS bo‘lgani uchun subscription arxitekturasi boshidan ko‘zda tutiladi.

Asosiy entitylar:

```text
Plan
Subscription
Invoice
```

Masalan:

```text
TRIAL
BASIC
PRO
```

Subscription holatlari:

```text
ACTIVE
TRIAL
EXPIRED
CANCELLED
```

Aniq tarif limitlari admin panel orqali boshqariladi.

---

# 50. BACKEND TEXNOLOGIYALARI

```text
Node.js
NestJS
TypeScript
pnpm
Prisma
PostgreSQL
Redis
BullMQ
Socket.IO
JWT
bcrypt
Helmet
```

---

# 51. BACKEND ARXITEKTURASI

Boshlang‘ich versiyada **Modular Monolith** ishlatiladi.

Microservice architecture MVP uchun qo‘llanmaydi.

Struktura:

```text
src/
├── auth/
├── users/
├── roles/
├── permissions/
├── tenants/
├── products/
├── categories/
├── units/
├── warehouses/
├── inventory/
├── purchases/
├── sales/
├── returns/
├── customers/
├── suppliers/
├── debts/
├── payments/
├── cashboxes/
├── expenses/
├── reports/
├── analytics/
├── notifications/
├── telegram/
├── subscriptions/
├── audit/
├── settings/
├── common/
└── config/
```

---

# 52. FRONTEND TEXNOLOGIYALARI

```text
React
TypeScript
Vite
React Router
TanStack Query
React Hook Form
Zod
MUI yoki shadcn/ui
```

---

# 53. FRONTEND SAHIFALARI

```text
Login

Dashboard

Sales
Products
Inventory
Purchases

Customers
Suppliers
Debts

Cashbox
Expenses

Reports
Analytics

Notifications

Users
Roles & Permissions

Settings
Subscription
```

---

# 54. API

REST API ishlatiladi.

Misollar:

```http
POST   /auth/login
POST   /auth/refresh
POST   /auth/logout

GET    /products
POST   /products
PATCH  /products/:id

GET    /inventory
GET    /inventory/movements

GET    /purchases
POST   /purchases

GET    /sales
POST   /sales
GET    /sales/:id

POST   /sales/:id/return

GET    /customers
GET    /customers/:id

GET    /debts
POST   /debts/:id/payment

GET    /cashboxes
POST   /cashboxes/:id/transactions

GET    /expenses
POST   /expenses

GET    /reports/daily
GET    /reports/monthly

GET    /analytics/dashboard
```

Swagger/OpenAPI documentation bo‘ladi.

---

# 55. TRANSACTION INTEGRITY

Quyidagi operatsiyalar database transaction orqali bajariladi:

### Sale

```text
Create Sale
 ↓
Create SaleItems
 ↓
Get Last Purchase Price
 ↓
Save costPriceSnapshot
 ↓
Decrease Inventory
 ↓
Create Payment
 ↓
Create Cash Transaction
 ↓
Update Debt if necessary
 ↓
Commit
```

Bir qadam xato bersa, butun transaction rollback qilinadi.

---

# 56. MUHIM BUSINESS RULES

### Rule 1

Stock default holatda manfiy bo‘lmaydi.

### Rule 2

Credit sale customer bilan bog‘langan bo‘lishi shart.

### Rule 3

Har bir SaleItem `costPriceSnapshot` saqlaydi.

### Rule 4

Mahsulotning yangi xarid narxi eski savdolarning foydasini o‘zgartirmaydi.

### Rule 5

Muhim savdo, payment va inventory operatsiyalari database transaction orqali bajariladi.

### Rule 6

Financial transactionlar hard delete qilinmaydi.

### Rule 7

Muhim o‘zgarishlar audit logga yoziladi.

### Rule 8

Tenantlar o‘rtasida data isolation majburiy.

### Rule 9

Endpointlarda authorization va permission tekshiriladi.

### Rule 10

Chegirma MVP’da faqat foiz ko‘rinishida ishlaydi.

### Rule 11

Opening stock va opening cash qo‘llab-quvvatlanadi.

### Rule 12

Sale lifecycle:

```text
DRAFT
→ CONFIRMED
→ COMPLETED
```

va kerak bo‘lsa:

```text
CANCELLED
```

---

# 57. SECURITY

Majburiy security:

* JWT;
* Access Token;
* Refresh Token;
* bcrypt;
* Helmet;
* CORS;
* Rate Limiting;
* DTO validation;
* Guards;
* Permissions;
* Audit Log;
* Environment variables;
* HTTPS;
* secure token strategy.

---

# 58. LOGGING

Backend structured logging ishlatadi.

Log levels:

```text
INFO
WARN
ERROR
```

Production muhitida request correlation va kerakli audit ma'lumotlari saqlanadi.

---

# 59. BACKUP

PostgreSQL avtomatik backup qilinadi.

Kamida:

```text
Daily Backup
Weekly Backup
```

Retention policy bilan saqlanadi.

Backup production serverdan alohida storage’da saqlanishi kerak.

---

# 60. DEPLOYMENT

Boshlang‘ich production:

```text
Docker
Nginx
React
NestJS
PostgreSQL
Redis
```

Arxitektura:

```text
                Internet
                    ↓
                  Nginx
               ↙         ↘
           React         NestJS API
                           ↓
                    ┌──────┴──────┐
                    ↓             ↓
               PostgreSQL       Redis
                                  ↓
                               BullMQ
                                  ↓
                            Telegram Bot
```

---

# 61. MVP

## MVP 1

```text
Authentication

Tenant
Users
Roles
Permissions

Products
Categories
Units
Custom Attributes

Warehouse
Inventory
Opening Stock

Sales
Cash
Card
Transfer
Credit
Mixed Payment
Percentage Discount

Customers
Debts
Debt Payments

Cashbox
Opening Cash

Expenses

Daily Reports
Basic Dashboard

Telegram Notifications
Socket.IO Notifications

Audit Log
Settings

Subscription
```

---

## MVP 2

```text
Purchases
Suppliers
Returns
Advanced Reports
Advanced Analytics
```

---

# 62. TIZIMNING ASOSIY BIZNES OQIMI

Umumiy jarayon:

```text
SUPPLIER
   ↓
PURCHASE
   ↓
WAREHOUSE
   ↓
INVENTORY
   ↓
SALE
   ├── CASH
   ├── CARD
   ├── TRANSFER
   └── CREDIT
          ↓
         DEBT
          ↓
     DEBT PAYMENT
          ↓
       CASHBOX
```

Parallel:

```text
SALE
 ↓
Inventory Transaction
 ↓
Analytics
 ↓
Dashboard
 ↓
Reports
```

---

# 63. TIZIMNING ASOSIY SAVOLLARGA JAVOBI

Tizim magazin egasiga quyidagi savollarga aniq javob bera olishi kerak:

```text
Bugun qancha savdo bo‘ldi?

Bugun qancha foyda qilindi?

Bugun qancha xarajat bo‘ldi?

Kassada qancha pul bor?

Kim qancha qarzdor?

Qaysi qarzlar muddati o‘tgan?

Omborda qancha tovar bor?

Qaysi mahsulotlar tugayapti?

Qaysi mahsulotlar ko‘p sotilyapti?

Qaysi mahsulotlar kam sotilyapti?

Bugungi va oylik pul oqimi qanday?

Oy boshidan beri qancha foyda olindi?
```

---

# 64. YAKUNIY MAQSAD

Loyihaning asosiy maqsadi:

> **Magazinning tovar, savdo, nasiya, qarzdorlik, kassa, xarajat va pul harakatini yagona tizimga birlashtirish hamda biznes egasiga real vaqt rejimida biznesning aniq holatini ko‘rsatish.**

Tizim universal bo‘ladi, bir nechta mustaqil tenantni qo‘llab-quvvatlaydi, admin orqali sozlanadi va kelajakda kengaytirishga tayyor arxitekturaga ega bo‘ladi.

### Yakuniy texnologik stack

```text
BACKEND
NestJS
TypeScript
pnpm
Prisma
PostgreSQL
Redis
BullMQ
Socket.IO
JWT
bcrypt
Helmet

FRONTEND
React
TypeScript
Vite
React Router
TanStack Query
React Hook Form
Zod
MUI yoki shadcn/ui

EXTERNAL
Telegram Bot API

INFRASTRUCTURE
Docker
Nginx
PostgreSQL
Redis
```

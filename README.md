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

`client/` hozircha bo'sh. Frontend alohida bosqichda qo'shiladi va backend bilan
faqat Swagger kontrakti orqali ishlaydi.

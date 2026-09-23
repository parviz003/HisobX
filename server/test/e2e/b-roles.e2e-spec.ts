import { PaymentType, Role, SaleStatus } from '@prisma/client';
import {
  API,
  TestContext,
  createTestApp,
  resetDatabase,
  resetRedis,
} from '../support/app';
import {
  SeededUser,
  Session,
  nextPhone,
  seedStore,
  seedUser,
  signIn,
} from '../support/auth';
import { Crypt } from '../../src/infrastructure/lib/Crypt';

/**
 * Blok B: MANAGER roli va ruxsatlar matritsasi (topshiriq 1-bo'lim).
 *
 *   MANAGER — do'kondagi hamma narsa: ADMIN va SELLER'lar, sozlamalar
 *   ADMIN   — MANAGER huquqlaridan tashqari hammasi (faqat SELLER'larni boshqaradi)
 *   SELLER  — savdo, mijozlar, qarz to'lovi; tannarx va boshqalarning savdolari ko'rinmaydi
 */
describe('B — Rollar va ruxsatlar matritsasi (e2e)', () => {
  let ctx: TestContext;
  let storeId: number;
  let manager: SeededUser;
  let admin: SeededUser;
  let seller: SeededUser;
  let managerSession: Session;
  let adminSession: Session;
  let sellerSession: Session;
  let superadminSession: Session;

  beforeAll(async () => {
    ctx = await createTestApp();
  });

  afterAll(async () => {
    await ctx.close();
  });

  beforeEach(async () => {
    await resetDatabase(ctx.db);
    await resetRedis(ctx.redis);

    const store = await seedStore(ctx);
    storeId = store.id;

    manager = await seedUser(ctx, { role: Role.MANAGER, storeId });
    admin = await seedUser(ctx, { role: Role.ADMIN, storeId });
    seller = await seedUser(ctx, { role: Role.SELLER, storeId });

    managerSession = await signIn(ctx, manager);
    adminSession = await signIn(ctx, admin);
    sellerSession = await signIn(ctx, seller);
    superadminSession = await signInSuperadmin();
  });

  /* ------------------------------ Xodim yaratish ----------------------------- */

  describe('POST /users — kim kimni yarata oladi', () => {
    it('MANAGER ADMIN yarata oladi', async () => {
      await createUser(managerSession, Role.ADMIN).expect(201);
    });

    it('MANAGER SELLER yarata oladi', async () => {
      await createUser(managerSession, Role.SELLER).expect(201);
    });

    it('MANAGER yana bitta MANAGER yarata olmaydi', async () => {
      const res = await createUser(managerSession, Role.MANAGER).expect(403);
      expect(res.body.code).toBe('FORBIDDEN');
    });

    it('ADMIN SELLER yarata oladi', async () => {
      await createUser(adminSession, Role.SELLER).expect(201);
    });

    it('ADMIN ADMIN yarata olmaydi', async () => {
      await createUser(adminSession, Role.ADMIN).expect(403);
    });

    it('SELLER umuman xodim yarata olmaydi', async () => {
      await createUser(sellerSession, Role.SELLER).expect(403);
    });

    it('SUPERADMIN ham MANAGER yarata olmaydi (faqat onboard yoki o‘tkazish)', async () => {
      await ctx
        .http()
        .post(`${API}/users`)
        .set('Cookie', superadminSession.cookies)
        .send({
          fullName: 'Yangi',
          phone: nextPhone(),
          password: 'Password123!',
          role: Role.MANAGER,
          storeId,
        })
        .expect(403);
    });
  });

  /* -------------------------------- Ro'yxat -------------------------------- */

  describe("GET /users — kim kimni ko'radi", () => {
    it("MANAGER o'z do'konidagi ADMIN va SELLER'larni ko'radi", async () => {
      const res = await get(`${API}/users`, managerSession).expect(200);
      const roles = (res.body.data.items as { role: Role }[]).map(
        (u) => u.role,
      );
      expect(new Set(roles)).toEqual(new Set([Role.ADMIN, Role.SELLER]));
    });

    it('ADMIN faqat SELLER‘larni ko‘radi', async () => {
      const res = await get(`${API}/users`, adminSession).expect(200);
      const roles = (res.body.data.items as { role: Role }[]).map(
        (u) => u.role,
      );
      expect(roles).toEqual([Role.SELLER]);
    });

    it("ADMIN role=ADMIN filtri bilan ham ADMIN'larni ko'ra olmaydi", async () => {
      const res = await get(`${API}/users?role=ADMIN`, adminSession).expect(
        200,
      );
      expect(res.body.data.items).toEqual([]);
    });
  });

  /* ------------------------------- Boshqarish ------------------------------- */

  describe('Xodimni tahrirlash va bloklash', () => {
    it("MANAGER ADMIN'ni bloklay oladi", async () => {
      await patchUser(managerSession, admin.id, { status: 'INACTIVE' }).expect(
        200,
      );
    });

    it("ADMIN boshqa ADMIN'ga tegа olmaydi", async () => {
      const other = await seedUser(ctx, { role: Role.ADMIN, storeId });
      await patchUser(adminSession, other.id, { status: 'INACTIVE' }).expect(
        403,
      );
    });

    it("MANAGER o'zini bloklay olmaydi", async () => {
      await patchUser(managerSession, manager.id, {
        status: 'INACTIVE',
      }).expect(403);
    });

    it("MANAGER o'z rolini o'zgartira olmaydi", async () => {
      await patchUser(managerSession, manager.id, { role: Role.ADMIN }).expect(
        403,
      );
    });

    it("MANAGER rolini PATCH orqali berib bo'lmaydi", async () => {
      await patchUser(managerSession, admin.id, { role: Role.MANAGER }).expect(
        403,
      );
    });

    it("boshqa do'kon xodimi umuman ko'rinmaydi (404)", async () => {
      const otherStore = await seedStore(ctx, "Boshqa Do'kon");
      const stranger = await seedUser(ctx, {
        role: Role.SELLER,
        storeId: otherStore.id,
      });
      await patchUser(managerSession, stranger.id, {
        status: 'INACTIVE',
      }).expect(404);
    });
  });

  /* ------------------------- Do'kon sozlamalari (MANAGER) ------------------- */

  describe('PATCH /stores/me — faqat MANAGER', () => {
    it('MANAGER sozlamalarni o‘zgartira oladi', async () => {
      await ctx
        .http()
        .patch(`${API}/stores/me`)
        .set('Cookie', managerSession.cookies)
        .send({ name: 'Yangi nom' })
        .expect(200);
    });

    it('ADMIN sozlamalarga tega olmaydi', async () => {
      await ctx
        .http()
        .patch(`${API}/stores/me`)
        .set('Cookie', adminSession.cookies)
        .send({ name: 'Yangi nom' })
        .expect(403);
    });
  });

  /* ---------------------------- Savdoni bekor qilish ------------------------ */

  describe('PATCH /sales/:id/cancel — faqat MANAGER va ADMIN', () => {
    it('SELLER bekor qila olmaydi', async () => {
      const sale = await seedSale(seller.id);
      await ctx
        .http()
        .patch(`${API}/sales/${sale.id}/cancel`)
        .set('Cookie', sellerSession.cookies)
        .expect(403);
    });

    it('ADMIN bekor qila oladi', async () => {
      const sale = await seedSale(seller.id);
      await ctx
        .http()
        .patch(`${API}/sales/${sale.id}/cancel`)
        .set('Cookie', adminSession.cookies)
        .expect(200);
    });
  });

  /* ------------------------ SELLER: tannarx va o'z savdolari ----------------- */

  describe('SELLER cheklovlari', () => {
    it("mahsulot ro'yxatida tannarx yo'q", async () => {
      await ctx.db.product.create({
        data: {
          storeId,
          name: 'Coca Cola',
          sellingPrice: 12000,
          lastPurchasePrice: 9000,
          stock: 10,
        },
      });

      const sellerRes = await get(`${API}/products`, sellerSession).expect(200);
      expect(sellerRes.body.data.items[0]).not.toHaveProperty(
        'lastPurchasePrice',
      );

      const adminRes = await get(`${API}/products`, adminSession).expect(200);
      expect(adminRes.body.data.items[0]).toHaveProperty('lastPurchasePrice');
    });

    it("faqat o'z savdolarini ko'radi", async () => {
      await seedSale(seller.id);
      await seedSale(admin.id);

      const sellerRes = await get(`${API}/sales`, sellerSession).expect(200);
      expect(sellerRes.body.data.meta.total).toBe(1);

      const adminRes = await get(`${API}/sales`, adminSession).expect(200);
      expect(adminRes.body.data.meta.total).toBe(2);
    });

    it('boshqaning savdosi tafsiloti 404', async () => {
      const sale = await seedSale(admin.id);
      await get(`${API}/sales/${sale.id}`, sellerSession).expect(404);
    });

    it("o'z savdosida tannarx ko'rinmaydi", async () => {
      const sale = await seedSale(seller.id);
      const res = await get(`${API}/sales/${sale.id}`, sellerSession).expect(
        200,
      );
      for (const item of res.body.data.saleItems as object[]) {
        expect(item).not.toHaveProperty('costPrice');
      }
    });
  });

  /* ------------------------------- Menejerlik ------------------------------- */

  describe("Do'kon va menejerlik", () => {
    it('POST /stores/onboard MANAGER yaratadi', async () => {
      const res = await ctx
        .http()
        .post(`${API}/stores/onboard`)
        .set('Cookie', superadminSession.cookies)
        .send({
          store: { name: "Yangi Do'kon" },
          admin: {
            fullName: 'Rahbar',
            phone: nextPhone(),
            password: 'Password123!',
          },
        })
        .expect(201);

      expect(res.body.data.manager.role).toBe(Role.MANAGER);
    });

    it("PATCH /stores/:id/manager menejerlikni o'tkazadi", async () => {
      const res = await ctx
        .http()
        .patch(`${API}/stores/${storeId}/manager`)
        .set('Cookie', superadminSession.cookies)
        .send({ userId: admin.id })
        .expect(200);

      expect(res.body.data.manager.id).toBe(admin.id);
      expect(res.body.data.manager.role).toBe(Role.MANAGER);
      expect(res.body.data.previousManagerId).toBe(manager.id);

      const old = await ctx.db.user.findUniqueOrThrow({
        where: { id: manager.id },
      });
      expect(old.role).toBe(Role.ADMIN);
    });

    it("boshqa do'kon xodimiga o'tkazib bo'lmaydi", async () => {
      const otherStore = await seedStore(ctx, "Boshqa Do'kon");
      const stranger = await seedUser(ctx, {
        role: Role.SELLER,
        storeId: otherStore.id,
      });

      const res = await ctx
        .http()
        .patch(`${API}/stores/${storeId}/manager`)
        .set('Cookie', superadminSession.cookies)
        .send({ userId: stranger.id })
        .expect(404);
      expect(res.body.code).toBe('USER_NOT_FOUND');
    });

    it('allaqachon meneger bo‘lsa 409', async () => {
      const res = await ctx
        .http()
        .patch(`${API}/stores/${storeId}/manager`)
        .set('Cookie', superadminSession.cookies)
        .send({ userId: manager.id })
        .expect(409);
      expect(res.body.code).toBe('MANAGER_ALREADY_EXISTS');
    });

    it("bazada har do'konda faqat bitta MANAGER bo'la oladi", async () => {
      await expect(
        ctx.db.user.update({
          where: { id: admin.id },
          data: { role: Role.MANAGER },
        }),
      ).rejects.toThrow();
    });
  });

  /* --------------------------------- Signup --------------------------------- */

  it('POST /auth/signup umuman mavjud emas (404)', async () => {
    await ctx
      .http()
      .post(`${API}/auth/signup`)
      .send({
        fullName: 'Kimdir',
        phone: nextPhone(),
        password: 'Password123!',
        storeName: "Do'kon",
      })
      .expect(404);
  });

  /* ------------------------------ yordamchilar ------------------------------ */

  function get(path: string, session: Session) {
    return ctx.http().get(path).set('Cookie', session.cookies);
  }

  function createUser(session: Session, role: Role) {
    return ctx.http().post(`${API}/users`).set('Cookie', session.cookies).send({
      fullName: 'Yangi Xodim',
      phone: nextPhone(),
      password: 'Password123!',
      role,
    });
  }

  function patchUser(
    session: Session,
    id: number,
    body: Record<string, unknown>,
  ) {
    return ctx
      .http()
      .patch(`${API}/users/${id}`)
      .set('Cookie', session.cookies)
      .send(body);
  }

  let saleNumber = 0;
  async function seedSale(userId: number) {
    saleNumber += 1;
    const product = await ctx.db.product.create({
      data: {
        storeId,
        name: `Mahsulot ${saleNumber}`,
        sellingPrice: 10000,
        lastPurchasePrice: 7000,
        stock: 100,
      },
    });

    return ctx.db.sale.create({
      data: {
        storeId,
        userId,
        saleNumber,
        status: SaleStatus.COMPLETED,
        paymentType: PaymentType.CASH,
        subtotal: 10000,
        totalAmount: 10000,
        saleItems: {
          create: [
            {
              productId: product.id,
              quantity: 1,
              price: 10000,
              costPrice: 7000,
              total: 10000,
            },
          ],
        },
      },
    });
  }

  async function signInSuperadmin(): Promise<Session> {
    const superadmin = await ctx.db.user.findFirstOrThrow({
      where: { role: Role.SUPERADMIN },
    });
    await ctx.db.user.update({
      where: { id: superadmin.id },
      data: { password: await Crypt.hash('SuperPass123!') },
    });
    return signIn(
      ctx,
      {
        id: superadmin.id,
        phone: superadmin.phone,
        password: 'SuperPass123!',
        role: Role.SUPERADMIN,
        storeId: null,
      },
      'Mozilla/5.0 (X11; Linux x86_64; rv:121.0) Firefox/121.0',
    );
  }
});

import { Role } from '@prisma/client';
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
  seedStore,
  seedUser,
  signIn,
} from '../support/auth';
import { Crypt } from '../../src/infrastructure/lib/Crypt';

/**
 * B1 yakuni: BARCHA ro'yxat endpointlari yagona shaklda qaytaradi —
 * `{ statusCode, data: { items, meta: { total, page, limit, totalPages } } }`.
 */
describe('B1 — Sahifalashning yagona shakli (e2e)', () => {
  let ctx: TestContext;
  let storeId: number;
  let admin: SeededUser;
  let adminSession: Session;
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
    admin = await seedUser(ctx, { role: Role.ADMIN, storeId });
    adminSession = await signIn(ctx, admin);

    const superadmin = await ctx.db.user.findFirstOrThrow({
      where: { role: Role.SUPERADMIN },
    });
    await ctx.db.user.update({
      where: { id: superadmin.id },
      data: { password: await Crypt.hash('SuperPass123!') },
    });
    superadminSession = await signIn(
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
  });

  /** Javob aynan kelishilgan shaklda ekanini tekshiradi */
  const expectPaginated = (body: any) => {
    expect(body.statusCode).toBe(200);
    expect(Object.keys(body.data).sort()).toEqual(['items', 'meta']);
    expect(Array.isArray(body.data.items)).toBe(true);
    expect(Object.keys(body.data.meta).sort()).toEqual([
      'limit',
      'page',
      'total',
      'totalPages',
    ]);
    for (const key of ['total', 'page', 'limit', 'totalPages']) {
      expect(typeof body.data.meta[key]).toBe('number');
    }
  };

  describe("Har bir ro'yxat endpointi { items, meta } qaytaradi", () => {
    it('GET /products', async () => {
      await seedProducts(ctx, storeId, 3);
      const res = await get(`${API}/products`, adminSession).expect(200);
      expectPaginated(res.body);
      expect(res.body.data.meta.total).toBe(3);
    });

    it('GET /categories', async () => {
      await ctx.db.category.createMany({
        data: [
          { storeId, name: 'Ichimliklar' },
          { storeId, name: 'Shirinliklar' },
        ],
      });
      const res = await get(`${API}/categories`, adminSession).expect(200);
      expectPaginated(res.body);
      expect(res.body.data.meta.total).toBe(2);
    });

    it('GET /customers', async () => {
      await ctx.db.customer.createMany({
        data: [
          { storeId, name: 'Alisher' },
          { storeId, name: 'Bobur' },
        ],
      });
      const res = await get(`${API}/customers`, adminSession).expect(200);
      expectPaginated(res.body);
      expect(res.body.data.meta.total).toBe(2);
    });

    it('GET /users', async () => {
      await seedUser(ctx, { role: Role.SELLER, storeId });
      await seedUser(ctx, { role: Role.SELLER, storeId });
      const res = await get(`${API}/users`, adminSession).expect(200);
      expectPaginated(res.body);
      expect(res.body.data.meta.total).toBe(2);
    });

    it('GET /stores (SUPERADMIN)', async () => {
      const res = await get(`${API}/stores`, superadminSession).expect(200);
      expectPaginated(res.body);
      expect(res.body.data.meta.total).toBe(1);
    });

    it('GET /sales', async () => {
      const res = await get(`${API}/sales`, adminSession).expect(200);
      expectPaginated(res.body);
    });

    it('GET /debts', async () => {
      const res = await get(`${API}/debts`, adminSession).expect(200);
      expectPaginated(res.body);
    });

    it('GET /debts/overdue', async () => {
      const res = await get(`${API}/debts/overdue`, adminSession).expect(200);
      expectPaginated(res.body);
    });

    it('GET /cash/transactions', async () => {
      const res = await get(`${API}/cash/transactions`, adminSession).expect(
        200,
      );
      expectPaginated(res.body);
    });

    it('GET /expenses', async () => {
      const res = await get(`${API}/expenses`, adminSession).expect(200);
      expectPaginated(res.body);
    });

    it('GET /expenses/categories', async () => {
      await ctx.db.expenseCategory.create({ data: { storeId, name: 'Ijara' } });
      const res = await get(`${API}/expenses/categories`, adminSession).expect(
        200,
      );
      expectPaginated(res.body);
      expect(res.body.data.meta.total).toBe(1);
    });

    it('GET /inventory/transactions', async () => {
      const res = await get(
        `${API}/inventory/transactions`,
        adminSession,
      ).expect(200);
      expectPaginated(res.body);
    });

    it('GET /inventory/stock', async () => {
      await seedProducts(ctx, storeId, 2);
      const res = await get(`${API}/inventory/stock`, adminSession).expect(200);
      expectPaginated(res.body);
      expect(res.body.data.meta.total).toBe(2);
    });
  });

  describe('meta hisoblari', () => {
    it('page va limit hurmat qilinadi, totalPages to‘g‘ri', async () => {
      await seedProducts(ctx, storeId, 25);

      const first = await get(
        `${API}/products?page=1&limit=10`,
        adminSession,
      ).expect(200);
      expect(first.body.data.items).toHaveLength(10);
      expect(first.body.data.meta).toEqual({
        total: 25,
        page: 1,
        limit: 10,
        totalPages: 3,
      });

      const last = await get(
        `${API}/products?page=3&limit=10`,
        adminSession,
      ).expect(200);
      expect(last.body.data.items).toHaveLength(5);
      expect(last.body.data.meta.page).toBe(3);
    });

    it('standart limit 20', async () => {
      await seedProducts(ctx, storeId, 25);
      const res = await get(`${API}/products`, adminSession).expect(200);
      expect(res.body.data.items).toHaveLength(20);
      expect(res.body.data.meta.limit).toBe(20);
    });

    it("bo'sh ro'yxatda items = [] va totalPages = 0", async () => {
      const res = await get(`${API}/products`, adminSession).expect(200);
      expect(res.body.data.items).toEqual([]);
      expect(res.body.data.meta.total).toBe(0);
      expect(res.body.data.meta.totalPages).toBe(0);
    });

    it("oxirgi sahifadan keyin items bo'sh, meta saqlanadi", async () => {
      await seedProducts(ctx, storeId, 3);
      const res = await get(
        `${API}/products?page=5&limit=10`,
        adminSession,
      ).expect(200);
      expect(res.body.data.items).toEqual([]);
      expect(res.body.data.meta.total).toBe(3);
      expect(res.body.data.meta.page).toBe(5);
    });

    it('limit 100 dan oshsa 400 (VALIDATION_ERROR)', async () => {
      const res = await get(`${API}/products?limit=500`, adminSession).expect(
        400,
      );
      expect(res.body.code).toBe('VALIDATION_ERROR');
    });

    it('page = 0 yoki manfiy bo‘lsa 400', async () => {
      await get(`${API}/products?page=0`, adminSession).expect(400);
      await get(`${API}/products?page=-1`, adminSession).expect(400);
    });
  });

  describe('Filtrlar sahifalash bilan birga ishlaydi', () => {
    it('search natijani ham, meta.total ni ham cheklaydi', async () => {
      await seedProducts(ctx, storeId, 5, 'Coca');
      await seedProducts(ctx, storeId, 3, 'Fanta');

      const res = await get(
        `${API}/products?search=Fanta&limit=10`,
        adminSession,
      ).expect(200);

      expect(res.body.data.meta.total).toBe(3);
      expect(res.body.data.items).toHaveLength(3);
    });

    it('customers qidiruvi sahifalash bilan', async () => {
      await ctx.db.customer.createMany({
        data: [
          { storeId, name: 'Alisher Valiyev' },
          { storeId, name: 'Alisher Karimov' },
          { storeId, name: 'Bobur Toshev' },
        ],
      });

      const res = await get(
        `${API}/customers?search=Alisher&limit=1`,
        adminSession,
      ).expect(200);

      expect(res.body.data.meta.total).toBe(2);
      expect(res.body.data.items).toHaveLength(1);
      expect(res.body.data.meta.totalPages).toBe(2);
    });
  });

  /* ------------------------------ yordamchilar ------------------------------ */

  function get(path: string, session: Session) {
    return ctx.http().get(path).set('Cookie', session.cookies);
  }

  async function seedProducts(
    context: TestContext,
    store: number,
    count: number,
    prefix = 'Mahsulot',
  ) {
    await context.db.product.createMany({
      data: Array.from({ length: count }, (_, i) => ({
        storeId: store,
        name: `${prefix} ${i + 1}`,
        sellingPrice: 10000,
        stock: 10,
        minStock: 2,
      })),
    });
  }
});

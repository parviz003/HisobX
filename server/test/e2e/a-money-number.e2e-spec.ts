import {
  CashTransactionType,
  InventoryTransactionType,
  PaymentType,
  Role,
  SaleStatus,
} from '@prisma/client';
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

/**
 * Blok A: pul va miqdor maydonlari JSON'da `number` bo'lib chiqadi.
 *
 * Prisma `Decimal` ni qaytaradi va u JSON.stringify'da string bo'lib ketadi —
 * frontend esa kontrakt bo'yicha son kutadi. O'girish `DecimalSerializerInterceptor`
 * da, ya'ni bitta markaziy joyda; shu test o'sha joyning barcha modullar uchun
 * ishlayotganini tekshiradi.
 */
describe("A — Pul va miqdor JSON'da number (e2e)", () => {
  let ctx: TestContext;
  let storeId: number;
  let admin: SeededUser;
  let session: Session;

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
    session = await signIn(ctx, admin);

    await seedMoneyData();
  });

  /** Kontraktda `number` bo'lishi shart bo'lgan maydonlar */
  const NUMERIC_KEYS = [
    'sellingPrice',
    'lastPurchasePrice',
    'stock',
    'minStock',
    'subtotal',
    'discountPercent',
    'discountAmount',
    'totalAmount',
    'price',
    'costPrice',
    'total',
    'amount',
    'remainingAmount',
    'balance',
    'unitPrice',
    'quantity',
  ];

  /**
   * Javobni rekursiv aylanib, yuqoridagi kalitlarning har birini tekshiradi.
   * Ichma-ich joylashgan obyektlar ham (masalan `sale.saleItems[].price`) qamrab olinadi.
   */
  function expectNumericFields(value: unknown, path = 'data'): number {
    if (value === null || typeof value !== 'object') return 0;

    if (Array.isArray(value)) {
      return value.reduce<number>(
        (count, item, index) =>
          count + expectNumericFields(item, `${path}[${index}]`),
        0,
      );
    }

    let checked = 0;
    for (const [key, item] of Object.entries(
      value as Record<string, unknown>,
    )) {
      if (NUMERIC_KEYS.includes(key) && item !== null && item !== undefined) {
        // Xato chiqsa qaysi maydon ekani ko'rinib tursin
        expect(`${path}.${key}=${typeof item}`).toBe(`${path}.${key}=number`);
        checked += 1;
      }
      checked += expectNumericFields(item, `${path}.${key}`);
    }
    return checked;
  }

  const get = (path: string) =>
    ctx.http().get(path).set('Cookie', session.cookies);

  /** Har bir ro'yxatda tekshiriladigan maydon HAQIQATAN bor ekaniga ishonch hosil qilamiz */
  async function expectListHasNumbers(path: string, minFields = 1) {
    const res = await get(path).expect(200);
    const checked = expectNumericFields(res.body.data);
    expect({ path, checked: checked >= minFields }).toEqual({
      path,
      checked: true,
    });
  }

  it('GET /products — narx va qoldiq', async () => {
    await expectListHasNumbers(`${API}/products`, 4);
  });

  it('GET /inventory/stock — qoldiqlar', async () => {
    await expectListHasNumbers(`${API}/inventory/stock`);
  });

  it('GET /inventory/transactions — miqdor va kirim narxi', async () => {
    await expectListHasNumbers(`${API}/inventory/transactions`, 2);
  });

  it('GET /sales — savdo summalari', async () => {
    await expectListHasNumbers(`${API}/sales`, 3);
  });

  it('GET /sales/:id — savdo qatorlari ham', async () => {
    const sale = await ctx.db.sale.findFirstOrThrow({ where: { storeId } });
    const res = await get(`${API}/sales/${sale.id}`).expect(200);
    expect(expectNumericFields(res.body.data)).toBeGreaterThanOrEqual(5);
  });

  it('GET /debts — qarz va qoldiq', async () => {
    await expectListHasNumbers(`${API}/debts`, 2);
  });

  it('GET /cash/transactions — summa va balans', async () => {
    await expectListHasNumbers(`${API}/cash/transactions`, 2);
  });

  it('GET /expenses — xarajat summasi', async () => {
    await expectListHasNumbers(`${API}/expenses`);
  });

  it('GET /customers — mijoz qarzi', async () => {
    const res = await get(`${API}/customers`).expect(200);
    expectNumericFields(res.body.data);
  });

  it("aniqlik yo'qolmaydi: 12345678.99 aynan shunday qaytadi", async () => {
    await ctx.db.product.create({
      data: {
        storeId,
        name: 'Aniqlik testi',
        sellingPrice: '12345678.99',
        stock: 1,
      },
    });

    const res = await get(`${API}/products?search=Aniqlik testi`).expect(200);
    const product = (res.body.data.items as { sellingPrice: number }[])[0];
    expect(product.sellingPrice).toBe(12345678.99);
  });

  /* ------------------------------ yordamchilar ------------------------------ */

  async function seedMoneyData() {
    const product = await ctx.db.product.create({
      data: {
        storeId,
        name: 'Coca Cola 1L',
        sellingPrice: '12000.50',
        lastPurchasePrice: '9000.25',
        stock: 25,
        minStock: 5,
      },
    });

    const customer = await ctx.db.customer.create({
      data: { storeId, name: 'Alisher' },
    });

    const sale = await ctx.db.sale.create({
      data: {
        storeId,
        userId: admin.id,
        customerId: customer.id,
        saleNumber: 1,
        status: SaleStatus.COMPLETED,
        paymentType: PaymentType.CREDIT,
        subtotal: '24001.00',
        discountPercent: '10.00',
        discountAmount: '2400.10',
        totalAmount: '21600.90',
        saleItems: {
          create: [
            {
              productId: product.id,
              quantity: 2,
              price: '12000.50',
              costPrice: '9000.25',
              total: '24001.00',
            },
          ],
        },
      },
    });

    await ctx.db.debt.create({
      data: {
        storeId,
        saleId: sale.id,
        customerId: customer.id,
        amount: '21600.90',
        remainingAmount: '21600.90',
      },
    });

    await ctx.db.cashTransaction.create({
      data: {
        storeId,
        userId: admin.id,
        type: CashTransactionType.OPENING,
        amount: '500000.00',
        balance: '500000.00',
      },
    });

    const expenseCategory = await ctx.db.expenseCategory.create({
      data: { storeId, name: 'Ijara' },
    });

    await ctx.db.expense.create({
      data: {
        storeId,
        userId: admin.id,
        expenseCategoryId: expenseCategory.id,
        amount: '150000.00',
      },
    });

    await ctx.db.inventoryTransaction.create({
      data: {
        storeId,
        productId: product.id,
        type: InventoryTransactionType.PURCHASE,
        quantity: 25,
        unitPrice: '9000.25',
      },
    });
  }
});

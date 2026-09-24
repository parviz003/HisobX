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

describe('C — Asosiy biznes jarayonlari (e2e)', () => {
  let ctx: TestContext;
  let storeId: number;
  let manager: SeededUser;
  let seller: SeededUser;
  let managerSession: Session;
  let sellerSession: Session;

  beforeAll(async () => {
    ctx = await createTestApp();
  });

  afterAll(async () => {
    await ctx.close();
  });

  beforeEach(async () => {
    await resetDatabase(ctx.db);
    await resetRedis(ctx.redis);

    const store = await seedStore(ctx, 'Biznes Test Do‘kon');
    storeId = store.id;

    manager = await seedUser(ctx, {
      role: Role.MANAGER,
      storeId,
      fullName: 'Test Menejer',
    });
    seller = await seedUser(ctx, {
      role: Role.SELLER,
      storeId,
      fullName: 'Test Sotuvchi',
    });

    managerSession = await signIn(ctx, manager);
    sellerSession = await signIn(ctx, seller);
  });

  const get = (path: string, session: Session) =>
    ctx.http().get(path).set('Cookie', session.cookies);

  const post = (path: string, session: Session, body: any) =>
    ctx.http().post(path).set('Cookie', session.cookies).send(body);

  const patch = (path: string, session: Session, body?: any) =>
    ctx.http().patch(path).set('Cookie', session.cookies).send(body ?? {});

  /* -------------------------------------------------------------------------- */
  /* 1. MAHSULOTLAR VA SHTRIX-KOD QIDIRUVI                                      */
  /* -------------------------------------------------------------------------- */

  describe('1. Mahsulotlar, qidiruv va tannarx maxfiyligi', () => {
    let categoryId: number;
    let productId: number;

    it('Kategoriya va mahsulot yaratish', async () => {
      const catRes = await post(`${API}/categories`, managerSession, {
        name: 'Ichimliklar',
      }).expect(201);
      categoryId = catRes.body.data.id;

      const prodRes = await post(`${API}/products`, managerSession, {
        name: 'Coca-Cola 1.5L',
        categoryId,
        sellingPrice: 14000,
        barcode: '5449000000996',
        minStock: 10,
        unit: 'dona',
      }).expect(201);

      productId = prodRes.body.data.id;
      expect(prodRes.body.data.name).toBe('Coca-Cola 1.5L');
      expect(prodRes.body.data.barcode).toBe('5449000000996');
      expect(prodRes.body.data.sellingPrice).toBe(14000);
    });

    it('Bir xil shtrix-kod bilan qayta yaratish taqiqlanadi (409 Conflict)', async () => {
      const catRes = await post(`${API}/categories`, managerSession, {
        name: 'Ichimliklar',
      }).expect(201);

      await post(`${API}/products`, managerSession, {
        name: 'Coca-Cola 1.5L',
        categoryId: catRes.body.data.id,
        sellingPrice: 14000,
        barcode: '5449000000996',
      }).expect(201);

      await post(`${API}/products`, managerSession, {
        name: 'Boshqa ichimlik',
        categoryId: catRes.body.data.id,
        sellingPrice: 15000,
        barcode: '5449000000996',
      }).expect(409);
    });

    it('Mahsulotlarni nomi va shtrix-kodi bo‘yicha qidirish', async () => {
      const catRes = await post(`${API}/categories`, managerSession, {
        name: 'Sut mahsulotlari',
      }).expect(201);

      await post(`${API}/products`, managerSession, {
        name: 'Nestle Sut 1L',
        categoryId: catRes.body.data.id,
        sellingPrice: 12000,
        barcode: '4780011223344',
      }).expect(201);

      // 1. Shtrix-kod bo'yicha qidiruv
      const barcodeSearch = await get(
        `${API}/products?search=4780011223344`,
        managerSession,
      ).expect(200);
      expect(barcodeSearch.body.data.items).toHaveLength(1);
      expect(barcodeSearch.body.data.items[0].name).toBe('Nestle Sut 1L');

      // 2. Qisman shtrix-kod
      const partialBarcode = await get(
        `${API}/products?search=112233`,
        managerSession,
      ).expect(200);
      expect(partialBarcode.body.data.items).toHaveLength(1);

      // 3. Nomi bo'yicha
      const nameSearch = await get(
        `${API}/products?search=Nestle`,
        managerSession,
      ).expect(200);
      expect(nameSearch.body.data.items).toHaveLength(1);

      // 4. Mavjud bo'lmagan
      const noneSearch = await get(
        `${API}/products?search=MavjudEmas999`,
        managerSession,
      ).expect(200);
      expect(noneSearch.body.data.items).toHaveLength(0);
    });

    it('Tannarx (lastPurchasePrice) sotuvchiga yashiriladi, menejerga ko‘rinadi', async () => {
      const catRes = await post(`${API}/categories`, managerSession, {
        name: 'Non',
      }).expect(201);

      const prodRes = await post(`${API}/products`, managerSession, {
        name: 'Buxonka',
        categoryId: catRes.body.data.id,
        sellingPrice: 3000,
      }).expect(201);

      const pId = prodRes.body.data.id;

      // Kirim qilish
      await post(`${API}/inventory/purchase`, managerSession, {
        productId: pId,
        quantity: 50,
        unitPrice: 2200,
      }).expect(201);

      // Menejer ko'rganda lastPurchasePrice bor
      const mgrGet = await get(`${API}/products/${pId}`, managerSession).expect(200);
      expect(mgrGet.body.data.lastPurchasePrice).toBe(2200);

      // Sotuvchi ko'rganda lastPurchasePrice yashirilgan (undefined)
      const sellerGet = await get(`${API}/products/${pId}`, sellerSession).expect(200);
      expect(sellerGet.body.data.lastPurchasePrice).toBeUndefined();
    });
  });

  /* -------------------------------------------------------------------------- */
  /* 2. OMBOR VA ZAXIRA CHEKLOVI (INVENTORY LIMITS)                             */
  /* -------------------------------------------------------------------------- */

  describe('2. Ombor kirimi va zaxira limiti bo‘yicha hisobdan chiqarish', () => {
    let productId: number;

    beforeEach(async () => {
      const prodRes = await post(`${API}/products`, managerSession, {
        name: 'Shakar 1kg',
        sellingPrice: 11000,
      }).expect(201);
      productId = prodRes.body.data.id;
    });

    it('Kirim qilinganda zaxira va oxirgi xarid narxi yangilanadi', async () => {
      await post(`${API}/inventory/purchase`, managerSession, {
        productId,
        quantity: 100,
        unitPrice: 8500,
        note: 'Optom kirim',
      }).expect(201);

      const prod = await get(`${API}/products/${productId}`, managerSession).expect(200);
      expect(prod.body.data.stock).toBe(100);
      expect(prod.body.data.lastPurchasePrice).toBe(8500);
    });

    it('Yetarli zaxira bo‘lmaganda hisobdan chiqarish 400 beradi', async () => {
      await post(`${API}/inventory/purchase`, managerSession, {
        productId,
        quantity: 20,
        unitPrice: 8500,
      }).expect(201);

      // 25 dona chiqarmoqchi bo'lamiz (faqat 20 dona bor)
      await post(`${API}/inventory/write-off`, managerSession, {
        productId,
        quantity: 25,
        note: 'Yaroqsiz',
      }).expect(400);

      // Muvaffaqiyatli hisobdan chiqarish: 5 dona
      await post(`${API}/inventory/write-off`, managerSession, {
        productId,
        quantity: 5,
        note: 'Yaroqsiz',
      }).expect(201);

      const prod = await get(`${API}/products/${productId}`, managerSession).expect(200);
      expect(prod.body.data.stock).toBe(15);
    });
  });

  /* -------------------------------------------------------------------------- */
  /* 3. SAVDO VA QARZ JARAYONI (CASH & CREDIT SALES)                             */
  /* -------------------------------------------------------------------------- */

  describe('3. Naqd va nasiya savdo, qarz so‘ndirish va kassa balansi', () => {
    let productId: number;
    let customerId: number;

    beforeEach(async () => {
      const prodRes = await post(`${API}/products`, managerSession, {
        name: 'Yog‘ 1L',
        sellingPrice: 18000,
      }).expect(201);
      productId = prodRes.body.data.id;

      // Zaxiraga 50 dona kirim qilamiz (tannarx 14000)
      await post(`${API}/inventory/purchase`, managerSession, {
        productId,
        quantity: 50,
        unitPrice: 14000,
      }).expect(201);

      const custRes = await post(`${API}/customers`, managerSession, {
        name: 'Botir Qodirov',
        phone: '+998901234567',
      }).expect(201);
      customerId = custRes.body.data.id;
    });

    it('Naqd savdo mahsulot zaxirasini kamaytiradi va kassaga pul kiradi', async () => {
      const saleRes = await post(`${API}/sales`, sellerSession, {
        paymentType: 'CASH',
        items: [{ productId, quantity: 5 }],
      }).expect(201);

      expect(saleRes.body.data.totalAmount).toBe(90000);
      expect(saleRes.body.data.status).toBe('COMPLETED');

      // Zaxira 50 - 5 = 45 bo'lishi kerak
      const prod = await get(`${API}/products/${productId}`, managerSession).expect(200);
      expect(prod.body.data.stock).toBe(45);

      // Kassa operatsiyalari
      const cashRes = await get(`${API}/cash/transactions`, managerSession).expect(200);
      expect(cashRes.body.data.items).toHaveLength(1);
      expect(cashRes.body.data.items[0].type).toBe('SALE');
      expect(cashRes.body.data.items[0].amount).toBe(90000);
    });

    it('Nasiya savdo qarz yaratadi va mijoz totalDebt da aks etadi', async () => {
      const saleRes = await post(`${API}/sales`, sellerSession, {
        customerId,
        paymentType: 'CREDIT',
        items: [{ productId, quantity: 3 }],
        dueDate: '2026-10-15',
      }).expect(201);

      expect(saleRes.body.data.totalAmount).toBe(54000);

      // Mijoz ro'yxatida totalDebt 54000 bo'lishi kerak
      const customersRes = await get(`${API}/customers`, managerSession).expect(200);
      const customer = customersRes.body.data.items.find(
        (c: any) => c.id === customerId,
      );
      expect(customer).toBeDefined();
      expect(customer.totalDebt).toBe(54000);

      // Qarzlar ro'yxatida qarz ko'rinadi
      const debtsRes = await get(`${API}/debts`, managerSession).expect(200);
      expect(debtsRes.body.data.items).toHaveLength(1);
      const debt = debtsRes.body.data.items[0];
      expect(debt.amount).toBe(54000);
      expect(debt.remainingAmount).toBe(54000);
      expect(debt.isPaid).toBe(false);

      // Qarzga to'lov qilish: 34000 to'laymiz
      const payRes = await post(`${API}/debts/${debt.id}/pay`, sellerSession, {
        amount: 34000,
        note: 'Qisman to‘lov',
      }).expect(201);

      expect(payRes.body.data.remainingAmount).toBe(20000);
      expect(payRes.body.data.isPaid).toBe(false);

      // Mijozning yangilangan qarzi 20000 bo'lishi kerak
      const updatedCustRes = await get(`${API}/customers`, managerSession).expect(200);
      const updatedCust = updatedCustRes.body.data.items.find(
        (c: any) => c.id === customerId,
      );
      expect(updatedCust.totalDebt).toBe(20000);

      // Kassada DEBT_PAYMENT bo'yicha 34000 paydo bo'lishi kerak
      const cashRes = await get(`${API}/cash/transactions`, managerSession).expect(200);
      const debtCashTx = cashRes.body.data.items.find(
        (t: any) => t.type === 'DEBT_PAYMENT',
      );
      expect(debtCashTx).toBeDefined();
      expect(debtCashTx.amount).toBe(34000);

      // Qolgan 20000 ni to'lab, to'liq yopamiz
      const finalPay = await post(`${API}/debts/${debt.id}/pay`, sellerSession, {
        amount: 20000,
      }).expect(201);

      expect(finalPay.body.data.remainingAmount).toBe(0);
      expect(finalPay.body.data.isPaid).toBe(true);

      // Mijozning qarzi endi 0 bo'lishi kerak
      const finalCustRes = await get(`${API}/customers`, managerSession).expect(200);
      const finalCust = finalCustRes.body.data.items.find(
        (c: any) => c.id === customerId,
      );
      expect(finalCust.totalDebt).toBe(0);
    });
  });

  /* -------------------------------------------------------------------------- */
  /* 4. SAVDONI BEKOR QILISH (CANCELLATION & REVERSAL)                           */
  /* -------------------------------------------------------------------------- */

  describe('4. Savdoni bekor qilish (zaxira va kassaning qaytishi)', () => {
    let productId: number;
    let customerId: number;

    beforeEach(async () => {
      const prodRes = await post(`${API}/products`, managerSession, {
        name: 'Choy 100g',
        sellingPrice: 10000,
      }).expect(201);
      productId = prodRes.body.data.id;

      await post(`${API}/inventory/purchase`, managerSession, {
        productId,
        quantity: 30,
        unitPrice: 7000,
      }).expect(201);

      const custRes = await post(`${API}/customers`, managerSession, {
        name: 'Sardor Aliyev',
        phone: '+998912223344',
      }).expect(201);
      customerId = custRes.body.data.id;
    });

    it('Naqd savdoni bekor qilish: zaxira oshadi, kassaga manfiy tuzatish yoziladi', async () => {
      const saleRes = await post(`${API}/sales`, sellerSession, {
        paymentType: 'CASH',
        items: [{ productId, quantity: 10 }],
      }).expect(201);
      const saleId = saleRes.body.data.id;

      // Zaxira 20 ga tushgan
      const prodBefore = await get(`${API}/products/${productId}`, managerSession).expect(200);
      expect(prodBefore.body.data.stock).toBe(20);

      // Savdoni bekor qilamiz
      const cancelRes = await patch(
        `${API}/sales/${saleId}/cancel`,
        managerSession,
      ).expect(200);
      expect(cancelRes.body.data.status).toBe('CANCELLED');

      // Zaxira yana 30 ga chiqdi
      const prodAfter = await get(`${API}/products/${productId}`, managerSession).expect(200);
      expect(prodAfter.body.data.stock).toBe(30);

      // Kassada ADJUSTMENT (-100000) yozildi
      const cashRes = await get(`${API}/cash/transactions`, managerSession).expect(200);
      const adjustTx = cashRes.body.data.items.find(
        (t: any) => t.type === 'ADJUSTMENT' && t.saleId === saleId,
      );
      expect(adjustTx).toBeDefined();
      expect(adjustTx.amount).toBe(-100000);
    });

    it('To‘lov qilingan nasiya savdoni bekor qilib bo‘lmaydi (400 Bad Request)', async () => {
      const saleRes = await post(`${API}/sales`, sellerSession, {
        customerId,
        paymentType: 'CREDIT',
        items: [{ productId, quantity: 5 }],
      }).expect(201);
      const saleId = saleRes.body.data.id;

      const debtsRes = await get(`${API}/debts`, managerSession).expect(200);
      const debt = debtsRes.body.data.items.find((d: any) => d.saleId === saleId);

      // Qarzga to'lov qilamiz
      await post(`${API}/debts/${debt.id}/pay`, sellerSession, {
        amount: 25000,
      }).expect(201);

      // Savdoni bekor qilishga urinish taqiqlanadi
      await patch(`${API}/sales/${saleId}/cancel`, managerSession).expect(400);
    });
  });

  /* -------------------------------------------------------------------------- */
  /* 5. BILDIRISHNOMALAR (NOTIFICATIONS)                                        */
  /* -------------------------------------------------------------------------- */

  describe('5. Bildirishnomalar va ularni o‘qilgan deb belgilash', () => {
    it('Bildirishnoma ro‘yxati, unreadCount va o‘qilgan deb belgilash', async () => {
      // 2 ta test bildirishnomasi yaratamiz
      await ctx.db.notification.createMany({
        data: [
          {
            storeId,
            type: 'LOW_STOCK',
            title: 'Kam qolgan mahsulot',
            message: 'Coca-cola kam qoldi',
            isRead: false,
          },
          {
            storeId,
            type: 'DEBT_REMINDER',
            title: 'Qarz muddati',
            message: 'Qarz to‘lash muddati yetdi',
            isRead: false,
          },
        ],
      });

      const listRes = await get(`${API}/notifications`, managerSession).expect(200);
      expect(listRes.body.data.items).toHaveLength(2);
      expect(listRes.body.data.items.every((n: any) => !n.isRead)).toBe(true);

      const firstId = listRes.body.data.items[0].id;

      // Bitta bildirishnomani o'qilgan deb belgilash
      await patch(`${API}/notifications/${firstId}/read`, managerSession).expect(200);

      const afterOneRes = await get(`${API}/notifications?isRead=false`, managerSession).expect(200);
      expect(afterOneRes.body.data.items).toHaveLength(1);

      // Barchasini o'qilgan deb belgilash
      await patch(`${API}/notifications/read-all`, managerSession).expect(200);

      const afterAllRes = await get(`${API}/notifications?isRead=false`, managerSession).expect(200);
      expect(afterAllRes.body.data.items).toHaveLength(0);
    });
  });

  /* -------------------------------------------------------------------------- */
  /* 6. KUNLIK HISOBOT (DAILY REPORT)                                          */
  /* -------------------------------------------------------------------------- */

  describe('6. Kunlik hisobot (savdolar, xarajatlar va foyda)', () => {
    it('Kunlik hisobot hisob-kitoblari to‘g‘ri chiqadi', async () => {
      const prodRes = await post(`${API}/products`, managerSession, {
        name: 'Un 1kg',
        sellingPrice: 8000,
      }).expect(201);
      const productId = prodRes.body.data.id;

      // Kirim: 10 dona, tannarx 5000
      await post(`${API}/inventory/purchase`, managerSession, {
        productId,
        quantity: 10,
        unitPrice: 5000,
      }).expect(201);

      // Savdo: 4 dona x 8000 = 32000 (tannarx 4 x 5000 = 20000, yalpi foyda = 12000)
      await post(`${API}/sales`, sellerSession, {
        paymentType: 'CASH',
        items: [{ productId, quantity: 4 }],
      }).expect(201);

      // Xarajat kategoriyasi va xarajat
      const catRes = await post(`${API}/expenses/categories`, managerSession, {
        name: 'Kommunal',
      }).expect(201);

      await post(`${API}/expenses`, managerSession, {
        expenseCategoryId: catRes.body.data.id,
        amount: 2000,
        note: 'Elektr energiyasi',
      }).expect(201);

      const today = new Date().toISOString().split('T')[0];
      const reportRes = await get(`${API}/reports/daily?date=${today}`, managerSession).expect(200);

      expect(reportRes.body.data).toBeDefined();
      expect(reportRes.body.data.revenue).toBe(32000);
      expect(reportRes.body.data.expenses).toBe(2000);
      expect(reportRes.body.data.grossProfit).toBe(12000);
      expect(reportRes.body.data.netProfit).toBe(10000);
    });
  });
});

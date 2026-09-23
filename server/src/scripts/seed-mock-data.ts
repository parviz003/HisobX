import { PrismaClient, Role, Status, SaleStatus, PaymentType, CashTransactionType, InventoryTransactionType, NotificationType } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function seed() {
  console.log('--- HisobX Mock Data Seeding Boshlandi ---');

  // 1. Topish yoki yaratish: Store
  let store = await prisma.store.findFirst({
    where: { isActive: true },
    include: { users: true },
    orderBy: { id: 'desc' },
  });

  if (!store) {
    store = await prisma.store.create({
      data: {
        name: 'Omad Market',
        phone: '+998901234567',
        address: 'Toshkent, Chilonzor 9',
        isActive: true,
      },
      include: { users: true },
    });
    console.log(`Do'kon yaratildi: ${store.name} (ID: ${store.id})`);
  } else {
    console.log(`Mavjud do'kon ishlatilmoqda: ${store.name} (ID: ${store.id})`);
  }

  const storeId = store.id;

  // 2. Manager yoki Admin topish/yaratish
  let manager = store.users.find((u) => u.role === Role.MANAGER || u.role === Role.ADMIN);
  if (!manager) {
    const hashedPassword = await bcrypt.hash('Admin123!', 7);
    manager = await prisma.user.create({
      data: {
        fullName: "Azizbek O'ralov",
        phone: '+998917328078',
        password: hashedPassword,
        role: Role.MANAGER,
        status: Status.ACTIVE,
        storeId,
      },
    });
    console.log(`Manager yaratildi: ${manager.fullName} (${manager.phone})`);
  } else {
    console.log(`Mavjud manager: ${manager.fullName} (${manager.phone})`);
  }

  const userId = manager.id;

  // Qo'shimcha sotuvchi va admin xodimlar
  const sellerPass = await bcrypt.hash('Seller123!', 7);
  const seller = await prisma.user.upsert({
    where: { phone: '+998901112233' },
    update: { storeId, role: Role.SELLER },
    create: {
      fullName: 'Dilshod Ergashev (Sotuvchi)',
      phone: '+998901112233',
      password: sellerPass,
      role: Role.SELLER,
      status: Status.ACTIVE,
      storeId,
    },
  });

  const adminPass = await bcrypt.hash('Admin123!', 7);
  await prisma.user.upsert({
    where: { phone: '+998902223344' },
    update: { storeId, role: Role.ADMIN },
    create: {
      fullName: 'Nodira Karimova (Hisobchi-Admin)',
      phone: '+998902223344',
      password: adminPass,
      role: Role.ADMIN,
      status: Status.ACTIVE,
      storeId,
    },
  });
  console.log('Xodimlar tayyorlandi (Sotuvchi va Admin).');

  // 3. Kategoriyalar
  const categoryNames = [
    'Ichimliklar',
    'Sut va sut mahsulotlari',
    'Non va qandolat',
    'Shirinliklar',
    'Oziq-ovqat va un',
    'Maishiy kimyo',
  ];

  const categories: Record<string, number> = {};
  for (const name of categoryNames) {
    const cat = await prisma.category.upsert({
      where: { storeId_name: { storeId, name } },
      update: {},
      create: { storeId, name },
    });
    categories[name] = cat.id;
  }
  console.log(`${Object.keys(categories).length} ta kategoriya tayyorlandi.`);

  // 4. Mahsulotlar (Katalog)
  const productDefs = [
    // Ichimliklar
    {
      name: 'Coca-Cola Classic 1.5L',
      barcode: '4780001234567',
      category: 'Ichimliklar',
      sellingPrice: 14000,
      lastPurchasePrice: 11500,
      stock: 48,
      minStock: 10,
      unit: 'dona',
    },
    {
      name: 'Fanta Orange 1.5L',
      barcode: '4780001234568',
      category: 'Ichimliklar',
      sellingPrice: 14000,
      lastPurchasePrice: 11500,
      stock: 36,
      minStock: 10,
      unit: 'dona',
    },
    {
      name: 'Hydrolife Gazsiz Suv 1L',
      barcode: '4780001234569',
      category: 'Ichimliklar',
      sellingPrice: 5000,
      lastPurchasePrice: 3500,
      stock: 65,
      minStock: 20,
      unit: 'dona',
    },
    {
      name: 'Dena Olma Sharbat 1L',
      barcode: '4780001234570',
      category: 'Ichimliklar',
      sellingPrice: 15000,
      lastPurchasePrice: 12000,
      stock: 24,
      minStock: 8,
      unit: 'dona',
    },
    {
      name: 'Ahmad Tea Ceylon 100g',
      barcode: '4780001234571',
      category: 'Ichimliklar',
      sellingPrice: 35000,
      lastPurchasePrice: 29000,
      stock: 2, // Low stock alert!
      minStock: 5,
      unit: 'dona',
    },
    // Sut mahsulotlari
    {
      name: 'Nestle Sut 3.2% 1L',
      barcode: '4780002345671',
      category: 'Sut va sut mahsulotlari',
      sellingPrice: 16000,
      lastPurchasePrice: 13000,
      stock: 32,
      minStock: 10,
      unit: 'dona',
    },
    {
      name: 'Bio Qatiq 1L',
      barcode: '4780002345672',
      category: 'Sut va sut mahsulotlari',
      sellingPrice: 12000,
      lastPurchasePrice: 9500,
      stock: 20,
      minStock: 6,
      unit: 'dona',
    },
    {
      name: "Musaffo Sariyog' 200g",
      barcode: '4780002345673',
      category: 'Sut va sut mahsulotlari',
      sellingPrice: 26000,
      lastPurchasePrice: 21000,
      stock: 25,
      minStock: 5,
      unit: 'dona',
    },
    // Non va qandolat
    {
      name: 'Toshkent non (patir)',
      barcode: '4780004567891',
      category: 'Non va qandolat',
      sellingPrice: 5000,
      lastPurchasePrice: 4000,
      stock: 55,
      minStock: 15,
      unit: 'dona',
    },
    {
      name: 'Buxoro qatlama non',
      barcode: '4780004567892',
      category: 'Non va qandolat',
      sellingPrice: 8000,
      lastPurchasePrice: 6500,
      stock: 28,
      minStock: 10,
      unit: 'dona',
    },
    // Shirinliklar
    {
      name: 'Qandolatchi Vafli 500g',
      barcode: '4780003456781',
      category: 'Shirinliklar',
      sellingPrice: 24000,
      lastPurchasePrice: 19000,
      stock: 22,
      minStock: 6,
      unit: 'dona',
    },
    {
      name: 'Alpen Gold Shokolad 85g',
      barcode: '4780003456782',
      category: 'Shirinliklar',
      sellingPrice: 15000,
      lastPurchasePrice: 12000,
      stock: 45,
      minStock: 10,
      unit: 'dona',
    },
    {
      name: 'Snickers Super 80g',
      barcode: '4780003456783',
      category: 'Shirinliklar',
      sellingPrice: 12000,
      lastPurchasePrice: 9500,
      stock: 0, // Out of stock!
      minStock: 5,
      unit: 'dona',
    },
    // Oziq-ovqat va un
    {
      name: 'Makfa Oliy navli un 2kg',
      barcode: '4607001239871',
      category: 'Oziq-ovqat va un',
      sellingPrice: 28000,
      lastPurchasePrice: 23000,
      stock: 25,
      minStock: 5,
      unit: 'dona',
    },
    {
      name: "Kungaboqar yog'i Zolotaya Semechka 1L",
      barcode: '4601234567890',
      category: 'Oziq-ovqat va un',
      sellingPrice: 21000,
      lastPurchasePrice: 17500,
      stock: 35,
      minStock: 8,
      unit: 'dona',
    },
    {
      name: 'Lazzat Guruch Alanga 1kg',
      barcode: '4780005678901',
      category: 'Oziq-ovqat va un',
      sellingPrice: 22000,
      lastPurchasePrice: 18000,
      stock: 45,
      minStock: 10,
      unit: 'kg',
    },
    {
      name: 'Shakar 1kg',
      barcode: '4780005678902',
      category: 'Oziq-ovqat va un',
      sellingPrice: 14000,
      lastPurchasePrice: 11500,
      stock: 60,
      minStock: 15,
      unit: 'kg',
    },
    // Maishiy kimyo
    {
      name: 'Fairy Limon Idish yuvish vositasi 450ml',
      barcode: '5410076543210',
      category: 'Maishiy kimyo',
      sellingPrice: 24000,
      lastPurchasePrice: 19000,
      stock: 16,
      minStock: 5,
      unit: 'dona',
    },
    {
      name: 'Ariel Avtomat Kir yuvish kukuni 1.5kg',
      barcode: '5410076543211',
      category: 'Maishiy kimyo',
      sellingPrice: 48000,
      lastPurchasePrice: 39000,
      stock: 12,
      minStock: 4,
      unit: 'dona',
    },
  ];

  const productsMap: Record<string, any> = {};
  for (const p of productDefs) {
    const categoryId = categories[p.category];
    const prod = await prisma.product.upsert({
      where: { storeId_barcode: { storeId, barcode: p.barcode } },
      update: {
        sellingPrice: p.sellingPrice,
        lastPurchasePrice: p.lastPurchasePrice,
        stock: p.stock,
        minStock: p.minStock,
        categoryId,
      },
      create: {
        storeId,
        name: p.name,
        barcode: p.barcode,
        unit: p.unit,
        sellingPrice: p.sellingPrice,
        lastPurchasePrice: p.lastPurchasePrice,
        stock: p.stock,
        minStock: p.minStock,
        categoryId,
      },
    });
    productsMap[p.name] = prod;

    // Ombor kirimi (Inventory Transaction)
    await prisma.inventoryTransaction.create({
      data: {
        storeId,
        productId: prod.id,
        type: InventoryTransactionType.PURCHASE,
        quantity: p.stock + 10,
        unitPrice: p.lastPurchasePrice,
        note: "Boshlang'ich partiya keltirildi",
      },
    });
  }
  console.log(`${Object.keys(productsMap).length} ta mahsulot va ombor kirimlari yaratildi.`);

  // 5. Mijozlar
  const customerDefs = [
    { name: 'Jasur Mahmudov', phone: '+998901114455', address: 'Toshkent, Chilonzor 8' },
    { name: 'Bobur Aliyev', phone: '+998935556677', address: 'Toshkent, Yunusobod 12' },
    { name: 'Kamola Yusupova', phone: '+998946667788', address: 'Toshkent, Mirobod 4' },
    { name: 'Sherzod Mirzayev', phone: '+998977778899', address: 'Toshkent, Sergeli 3' },
    { name: 'Gulnora Karimova', phone: '+998998889900', address: 'Toshkent, Shayxontohur' },
  ];

  const customersMap: Record<string, any> = {};
  for (const c of customerDefs) {
    let cust = await prisma.customer.findFirst({
      where: { storeId, phone: c.phone },
    });
    if (!cust) {
      cust = await prisma.customer.create({
        data: { storeId, ...c },
      });
    }
    customersMap[c.name] = cust;
  }
  console.log(`${Object.keys(customersMap).length} ta mijoz yaratildi.`);

  // 6. Xarajat toifalari va Xarajatlar
  const expenseCatDefs = [
    'Ijara to‘lovi',
    'Kommunal to‘lovlar',
    'Xodimlar tushligi',
    'Transport va yetkazish',
    'Xo‘jalik mollari',
  ];

  const expCats: Record<string, number> = {};
  for (const name of expenseCatDefs) {
    const ec = await prisma.expenseCategory.upsert({
      where: { storeId_name: { storeId, name } },
      update: {},
      create: { storeId, name },
    });
    expCats[name] = ec.id;
  }

  // Boshlang'ich kassa tranzaksiyasi
  let runningBalance = 1000000;
  await prisma.cashTransaction.create({
    data: {
      storeId,
      userId,
      type: CashTransactionType.OPENING,
      amount: 1000000,
      balance: runningBalance,
      note: "Boshlang'ich kassa qoldig'i",
    },
  });

  // Xarajat 1: Xodimlar tushligi
  const expAmount1 = 150000;
  runningBalance -= expAmount1;
  const exp1 = await prisma.expense.create({
    data: {
      storeId,
      expenseCategoryId: expCats['Xodimlar tushligi'],
      userId,
      amount: expAmount1,
      note: 'Bugungi xodimlar tushligi',
    },
  });
  await prisma.cashTransaction.create({
    data: {
      storeId,
      userId,
      type: CashTransactionType.EXPENSE,
      amount: expAmount1,
      balance: runningBalance,
      note: 'Xarajat: Xodimlar tushligi',
    },
  });

  // Xarajat 2: Kommunal
  const expAmount2 = 250000;
  runningBalance -= expAmount2;
  await prisma.expense.create({
    data: {
      storeId,
      expenseCategoryId: expCats['Kommunal to‘lovlar'],
      userId,
      amount: expAmount2,
      note: 'Elektr energiyasi uchun to‘lov',
    },
  });
  await prisma.cashTransaction.create({
    data: {
      storeId,
      userId,
      type: CashTransactionType.EXPENSE,
      amount: expAmount2,
      balance: runningBalance,
      note: 'Xarajat: Kommunal to‘lovlar',
    },
  });

  // 7. Savdolar (Sales)
  // Savdo #1: Naqd savdo (Coca-cola + Non)
  const pCola = productsMap['Coca-Cola Classic 1.5L'];
  const pNon = productsMap['Toshkent non (patir)'];
  const sale1Amount = 14000 * 3 + 5000 * 4; // 42,000 + 20,000 = 62,000
  runningBalance += sale1Amount;

  const sale1 = await prisma.sale.create({
    data: {
      storeId,
      userId: seller.id,
      saleNumber: 1,
      status: SaleStatus.COMPLETED,
      paymentType: PaymentType.CASH,
      subtotal: sale1Amount,
      totalAmount: sale1Amount,
      note: 'Kassadan tezkor savdo',
      saleItems: {
        create: [
          {
            productId: pCola.id,
            quantity: 3,
            price: 14000,
            costPrice: 11500,
            total: 42000,
          },
          {
            productId: pNon.id,
            quantity: 4,
            price: 5000,
            costPrice: 4000,
            total: 20000,
          },
        ],
      },
    },
  });

  await prisma.cashTransaction.create({
    data: {
      storeId,
      userId: seller.id,
      saleId: sale1.id,
      type: CashTransactionType.SALE,
      amount: sale1Amount,
      balance: runningBalance,
      note: `Savdo #${sale1.saleNumber}`,
    },
  });

  // Savdo #2: Naqd savdo (Un, Yog', Shakar - 5% chegirma bilan)
  const pUn = productsMap['Makfa Oliy navli un 2kg'];
  const pYog = productsMap["Kungaboqar yog'i Zolotaya Semechka 1L"];
  const pShakar = productsMap['Shakar 1kg'];
  const sub2 = 28000 * 1 + 21000 * 2 + 14000 * 2; // 28,000 + 42,000 + 28,000 = 98,000
  const disc2 = 4900;
  const tot2 = sub2 - disc2; // 93,100
  runningBalance += tot2;

  const sale2 = await prisma.sale.create({
    data: {
      storeId,
      userId: seller.id,
      saleNumber: 2,
      status: SaleStatus.COMPLETED,
      paymentType: PaymentType.CASH,
      subtotal: sub2,
      discountPercent: 5,
      discountAmount: disc2,
      totalAmount: tot2,
      note: '5% doimiy mijoz chegirmasi',
      saleItems: {
        create: [
          { productId: pUn.id, quantity: 1, price: 28000, costPrice: 23000, total: 28000 },
          { productId: pYog.id, quantity: 2, price: 21000, costPrice: 17500, total: 42000 },
          { productId: pShakar.id, quantity: 2, price: 14000, costPrice: 11500, total: 28000 },
        ],
      },
    },
  });

  await prisma.cashTransaction.create({
    data: {
      storeId,
      userId: seller.id,
      saleId: sale2.id,
      type: CashTransactionType.SALE,
      amount: tot2,
      balance: runningBalance,
      note: `Savdo #${sale2.saleNumber}`,
    },
  });

  // Savdo #3: Naqd savdo (Sut, Vafli, Sharbat)
  const pSut = productsMap['Nestle Sut 3.2% 1L'];
  const pVafli = productsMap['Qandolatchi Vafli 500g'];
  const pDena = productsMap['Dena Olma Sharbat 1L'];
  const tot3 = 16000 * 2 + 24000 * 1 + 15000 * 2; // 32,000 + 24,000 + 30,000 = 86,000
  runningBalance += tot3;

  const sale3 = await prisma.sale.create({
    data: {
      storeId,
      userId,
      saleNumber: 3,
      status: SaleStatus.COMPLETED,
      paymentType: PaymentType.CASH,
      subtotal: tot3,
      totalAmount: tot3,
      saleItems: {
        create: [
          { productId: pSut.id, quantity: 2, price: 16000, costPrice: 13000, total: 32000 },
          { productId: pVafli.id, quantity: 1, price: 24000, costPrice: 19000, total: 24000 },
          { productId: pDena.id, quantity: 2, price: 15000, costPrice: 12000, total: 30000 },
        ],
      },
    },
  });

  await prisma.cashTransaction.create({
    data: {
      storeId,
      userId,
      saleId: sale3.id,
      type: CashTransactionType.SALE,
      amount: tot3,
      balance: runningBalance,
      note: `Savdo #${sale3.saleNumber}`,
    },
  });

  // Savdo #4: NASIYA (Jasur Mahmudov) — Qarz va qisman to'lov
  const custJasur = customersMap['Jasur Mahmudov'];
  const pGuruch = productsMap['Lazzat Guruch Alanga 1kg'];
  const tot4 = 22000 * 2 + 21000 * 2 + 5000 * 2; // 44,000 + 42,000 + 10,000 = 96,000

  const sale4 = await prisma.sale.create({
    data: {
      storeId,
      userId,
      customerId: custJasur.id,
      saleNumber: 4,
      status: SaleStatus.COMPLETED,
      paymentType: PaymentType.CREDIT,
      subtotal: tot4,
      totalAmount: tot4,
      note: 'Oylikkacha nasiyaga berildi',
      saleItems: {
        create: [
          { productId: pGuruch.id, quantity: 2, price: 22000, costPrice: 18000, total: 44000 },
          { productId: pYog.id, quantity: 2, price: 21000, costPrice: 17500, total: 42000 },
          { productId: pNon.id, quantity: 2, price: 5000, costPrice: 4000, total: 10000 },
        ],
      },
    },
  });

  const dueJasur = new Date();
  dueJasur.setDate(dueJasur.getDate() + 10);

  const debt1 = await prisma.debt.create({
    data: {
      storeId,
      customerId: custJasur.id,
      saleId: sale4.id,
      amount: tot4,
      remainingAmount: 46000, // 50,000 to'langan!
      dueDate: dueJasur,
      isPaid: false,
      note: '10 kunda to‘laydi',
    },
  });

  // Qarz to'lovi (50,000 so'm kassaga kirdi)
  runningBalance += 50000;
  await prisma.debtPayment.create({
    data: {
      storeId,
      debtId: debt1.id,
      amount: 50000,
      note: 'Qarzning bir qismi to‘landi',
    },
  });

  await prisma.cashTransaction.create({
    data: {
      storeId,
      userId,
      type: CashTransactionType.DEBT_PAYMENT,
      amount: 50000,
      balance: runningBalance,
      note: `Qarz to‘lovi: ${custJasur.name}`,
    },
  });

  // Savdo #5: NASIYA (Bobur Aliyev) — MUDDATI O'TGAN QARZ
  const custBobur = customersMap['Bobur Aliyev'];
  const pTea = productsMap['Ahmad Tea Ceylon 100g'];
  const pChoc = productsMap['Alpen Gold Shokolad 85g'];
  const tot5 = 35000 * 2 + 15000 * 4; // 70,000 + 60,000 = 130,000

  const sale5 = await prisma.sale.create({
    data: {
      storeId,
      userId: seller.id,
      customerId: custBobur.id,
      saleNumber: 5,
      status: SaleStatus.COMPLETED,
      paymentType: PaymentType.CREDIT,
      subtotal: tot5,
      totalAmount: tot5,
      note: 'Muddati o‘tgan nasiya',
      saleItems: {
        create: [
          { productId: pTea.id, quantity: 2, price: 35000, costPrice: 29000, total: 70000 },
          { productId: pChoc.id, quantity: 4, price: 15000, costPrice: 12000, total: 60000 },
        ],
      },
    },
  });

  const overdueDate = new Date();
  overdueDate.setDate(overdueDate.getDate() - 3); // 3 kun oldin tugagan!

  await prisma.debt.create({
    data: {
      storeId,
      customerId: custBobur.id,
      saleId: sale5.id,
      amount: tot5,
      remainingAmount: tot5,
      dueDate: overdueDate,
      isPaid: false,
      note: 'Muddati o‘tgan qarz!',
    },
  });

  // 8. Bildirishnomalar (Notifications)
  await prisma.notification.createMany({
    data: [
      {
        storeId,
        type: NotificationType.LOW_STOCK,
        title: 'Kam qolgan mahsulot',
        message: "'Ahmad Tea Ceylon 100g' qoldig'i 2 dona qoldi (minimal: 5 dona).",
        isRead: false,
      },
      {
        storeId,
        type: NotificationType.DEBT_OVERDUE,
        title: "Muddati o'tgan qarz",
        message: "Bobur Aliyev (130,000 so'm) qarzini to'lash muddati 3 kun oldin o'tgan.",
        isRead: false,
      },
    ],
  });

  console.log('Bildirishnomalar va barcha moliyaviy operatsiyalar yaratildi!');
  console.log('Joriy Kassa Balansi:', runningBalance.toLocaleString(), "so'm");
  console.log('--- Mock Data Muvaffaqiyatli Qo‘shildi! ---');
}

seed()
  .catch((e) => {
    console.error('Seed xatosi:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

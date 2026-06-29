/**
 * Noro Lep POS — Seed Data Script
 * Populates Cockpit CMS with demo data for development and testing.
 * Run AFTER setup-collections.php has created all collections.
 *
 * Usage:
 *   cd frontend && bun run ../scripts/seed-data.ts
 *   OR
 *   COCKPIT_URL=http://localhost:3030 COCKPIT_API_KEY=admin bun run scripts/seed-data.ts
 */

const COCKPIT_URL = process.env.COCKPIT_URL ?? "http://localhost:3030";
const API_KEY = process.env.COCKPIT_API_KEY ?? "admin";

async function create(collection: string, data: Record<string, unknown>): Promise<any> {
  try {
    const response = await fetch(`${COCKPIT_URL}/api/content/item/${collection}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "api-key": API_KEY },
      body: JSON.stringify({ data }),
    });
    if (!response.ok) {
      console.warn(`  ⚠️  ${collection}: ${response.status}`);
      return null;
    }
    return response.json();
  } catch { return null; }
}

function uuid(): string { return crypto.randomUUID(); }
function today(): string { return new Date().toISOString().slice(0, 10); }
function now(): number { return Math.floor(Date.now() / 1000); }

async function seed() {
  console.log("🌱 Noro Lep POS — Seed Data Script\n");

  // Location
  console.log("📍 Location...");
  await create("location", { name: "Noro Lep Center", code: "CENTER", address: "Slovenska cesta 1", city: "Ljubljana", postalCode: "1000", phone: "01 234 5678", taxNumber: "12345678", businessPremiseId: "PRE", defaultTaxRate: 22, currency: "EUR", active: true, timezone: "Europe/Ljubljana" });

  // Categories
  console.log("📂 Categories...");
  const cats = ["Predjedi","Glavne jedi","Pijače","Sladice","Priloge"];
  const catIds: string[] = [];
  for (let i = 0; i < cats.length; i++) {
    const c = await create("category", { name: cats[i], description: cats[i], _o: String(i+1), image: { path: "", title: cats[i] } });
    if (c?._id) catIds.push(c._id);
  }

  // Menu items
  console.log("🍽️  Menu items...");
  const menus = [
    { n: "Margherita Pizza", d: "Paradižnik, mocarela, bazilika", p: 8.50, c: 1, a: ["gluten","milk"] },
    { n: "Pepperoni Pizza", d: "Salami, sir, paradižnik", p: 10.00, c: 1, a: ["gluten","milk"] },
    { n: "Carbonara", d: "Testenine, jajca, slanina", p: 9.50, c: 1, a: ["gluten","eggs","milk"] },
    { n: "Čevapčiči", d: "Mleti meso, čebula, kruh", p: 9.00, c: 1, a: ["gluten"] },
    { n: "Griliran losos", d: "Losos, limona, zelišča", p: 16.50, c: 1, a: ["fish"] },
    { n: "Vegi burger", d: "Fižoljev burger", p: 9.50, c: 1, a: ["gluten","soybeans"] },
    { n: "Cezar solata", d: "Zelenje, piščanec", p: 7.50, c: 0, a: ["eggs","milk"] },
    { n: "Bruschetta", d: "Kruh, paradižnik, česen", p: 5.00, c: 0, a: ["gluten"] },
    { n: "Coca-Cola 0.5L", d: "Hladna pijača", p: 2.50, c: 2, a: [] },
    { n: "Pivo Laško 0.5L", d: "Točeno pivo", p: 3.00, c: 2, a: ["gluten"] },
    { n: "Aperol Spritz", d: "Aperol, prosecco", p: 5.50, c: 2, a: ["sulphites"] },
    { n: "Kava espresso", d: "Single origin", p: 1.50, c: 2, a: [] },
    { n: "Čokoladna torta", d: "Temna čokolada", p: 4.50, c: 3, a: ["gluten","eggs","milk"] },
    { n: "Sladoled vanilija", d: "Domači sladoled", p: 3.00, c: 3, a: ["milk","eggs"] },
    { n: "Pomfrit", d: "Ocvrt krompir", p: 3.50, c: 4, a: [] },
  ];
  const menuIds: string[] = [];
  for (const m of menus) {
    const catId = catIds[m.c] ?? catIds[0];
    const created = await create("menu", { name: m.n, description: m.d, price: m.p, category: [{ _model: "category", _id: catId }], allergens: m.a, tax_rate: m.c === 1 ? 9.5 : 22, available: true, image: { path: "", title: m.n } });
    if (created?._id) menuIds.push(created._id);
  }

  // Tables
  console.log("🪑 Tables...");
  const tables = [["T1","4","Notranja"],["T2","4","Notranja"],["T3","6","Notranja"],["T4","2","Terasa"],["T5","2","Terasa"],["T6","8","VIP"],["B1","1","Bar"],["B2","1","Bar"]];
  for (const [num, seats, loc] of tables) {
    await create("table", { table_number: num, seats, location: loc, status: "available", publicToken: uuid(), order: null });
  }

  // Modifier groups
  console.log("🎛️  Modifiers...");
  const sizeGrp = await create("modifiergroup", { name: "Velikost", required: true, multiSelect: false, minSelect: 0, maxSelect: 0, sort: 1 });
  if (sizeGrp?._id) for (const [n, p] of [["Mala",0],["Srednja",2],["Velika",4]]) await create("modifieroption", { name: n, price: p, default: n === "Srednja", sort: 1, group: { _model: "modifiergroup", _id: sizeGrp._id } });
  const topGrp = await create("modifiergroup", { name: "Dodatki", required: false, multiSelect: true, minSelect: 0, maxSelect: 5, sort: 2 });
  if (topGrp?._id) for (const [n, p] of [["Sir",1.5],["Šunka",2.0],["Gobe",1.5]]) await create("modifieroption", { name: n, price: p, default: false, sort: 1, group: { _model: "modifiergroup", _id: topGrp._id } });

  // Inventory
  console.log("📦 Inventory...");
  const inv = [
    { name: "Moka tip 00", sku: "MOKA-001", unit: "kg", quantity: 25, threshold: 10, cost: 0.80 },
    { name: "Mocarela 1kg", sku: "MOC-001", unit: "kg", quantity: 8, threshold: 5, cost: 5.50 },
    { name: "Paradižnik passata", sku: "PAR-001", unit: "l", quantity: 15, threshold: 5, cost: 1.20 },
    { name: "Slanina 1kg", sku: "SLA-001", unit: "kg", quantity: 3, threshold: 5, cost: 7.00 },
    { name: "Losos filet", sku: "LOS-001", unit: "kg", quantity: 4, threshold: 3, cost: 18.00 },
    { name: "Krompir 5kg", sku: "KRO-001", unit: "kg", quantity: 30, threshold: 10, cost: 0.50 },
    { name: "Coca-Cola 0.5L", sku: "COCA-001", unit: "pc", quantity: 48, threshold: 24, cost: 0.80 },
    { name: "Pivo Laško 0.5L", sku: "PIV-001", unit: "pc", quantity: 60, threshold: 24, cost: 0.90 },
    { name: "Čokolada 70%", sku: "COK-001", unit: "kg", quantity: 2, threshold: 3, cost: 8.00 },
    { name: "Jajca 30kos", sku: "JAJ-001", unit: "pc", quantity: 60, threshold: 30, cost: 0.15 },
  ];
  const invIds: string[] = [];
  for (const i of inv) { const c = await create("inventoryitem", i); if (c?._id) invIds.push(c._id); }

  // Recipes
  console.log("recipe  Recipes...");
  if (menuIds[0] && invIds[0]) {
    await create("recipeitem", { menu: { _model: "menu", _id: menuIds[0] }, inventoryItem: { _model: "inventoryitem", _id: invIds[0] }, quantity: 0.3 });
    await create("recipeitem", { menu: { _model: "menu", _id: menuIds[0] }, inventoryItem: { _model: "inventoryitem", _id: invIds[1] }, quantity: 0.15 });
    await create("recipeitem", { menu: { _model: "menu", _id: menuIds[2] }, inventoryItem: { _model: "inventoryitem", _id: invIds[0] }, quantity: 0.2 });
    await create("recipeitem", { menu: { _model: "menu", _id: menuIds[2] }, inventoryItem: { _model: "inventoryitem", _id: invIds[9] }, quantity: 2 });
  }

  // Suppliers
  console.log("🚚 Suppliers...");
  const sups = [
    { name: "Metro Cash & Carry", contactPerson: "Janez Novak", email: "narocila@metro.si", phone: "01 300 3000", address: "Šmartinska 152, Ljubljana", taxNumber: "SI12345678", paymentTerms: "30 dni", active: true },
    { name: "Hofer", contactPerson: "Maja Horvat", email: "dobava@hofer.si", phone: "01 583 4000", address: "Letališka 26, Ljubljana", taxNumber: "SI87654321", paymentTerms: "15 dni", active: true },
    { name: "Sadd d.o.o.", contactPerson: "Tomaž Sadar", email: "tomas@sadd.si", phone: "01 200 3000", address: "Trubarjeva 50, Ljubljana", taxNumber: "SI11223344", paymentTerms: "predračun", active: true },
  ];
  const supIds: string[] = [];
  for (const s of sups) { const c = await create("supplier", s); if (c?._id) supIds.push(c._id); }

  // Invoice
  console.log("📄 Invoice...");
  if (supIds[0] && invIds[0]) {
    const inv = await create("invoice", { invoiceNumber: "2026-001", supplier: { _model: "supplier", _id: supIds[0] }, issueDate: today(), totalAmount: 0, status: "draft", staff: "manager" });
    if (inv?._id) {
      let total = 0;
      const items = [[invIds[0],"Moka",10,0.80],[invIds[1],"Mocarela",5,5.50],[invIds[2],"Passata",10,1.20]];
      for (const [id, name, qty, price] of items) { const lt = (qty as number) * (price as number); total += lt; await create("invoiceitem", { invoice: { _model: "invoice", _id: inv._id }, inventoryItem: { _model: "inventoryitem", _id: id as string }, itemName: name, quantity: qty, unitPrice: price, taxRate: 22, lineTotal: lt, restocked: false }); }
      await create("invoice", { _id: inv._id, totalAmount: total });
    }
  }

  // Customers
  console.log("🎁 Customers...");
  const custs = [["031234567","Ana Kovac",150,320,320.50,12],["041987654","Boris Janez",80,150,150.00,8],["051555333","Cvetka Zeleno",25,45,45.00,3],["070111222","David Modri",0,10,10.00,1],["040333444","Eva Rdeca",200,500,500.00,20]];
  for (const [phone, name, pts, lpts, spent, visits] of custs) await create("customer", { phone, name, points: pts, lifetimePoints: lpts, totalSpent: spent, visits, firstVisitAt: now() - 86400*30, lastVisitAt: now() - 86400 });

  // Rewards + config
  console.log("🎁 Rewards...");
  await create("loyaltyreward", { name: "Brezplačna kava", description: "Espresso", pointsCost: 50, discountType: "fixed", discountValue: 1.50, active: true });
  await create("loyaltyreward", { name: "10% popust", description: "Na celotni račun", pointsCost: 100, discountType: "percent", discountValue: 10, active: true });
  await create("loyaltyreward", { name: "Brezplačna sladica", description: "Poljubna sladica", pointsCost: 80, discountType: "fixed", discountValue: 4.50, active: true });
  await create("loyaltyconfig", { pointsPerEuro: 1, signupBonus: 10, expiryDays: 365, enabled: true, welcomeMessage: "Dobrodošli!" });

  // Promotions
  console.log("🏷️  Promotions...");
  await create("promotion", { name: "Happy Hour Pijače", description: "20% popust", type: "percentage", value: 20, startTime: "17:00", endTime: "19:00", days: [1,2,3,4,5], active: true });
  await create("promotion", { name: "Kosilo posebna", description: "5€ popust", type: "fixed", value: 5, startTime: "11:00", endTime: "15:00", days: [1,2,3,4,5], active: true });

  // Shifts
  console.log("👤 Shifts...");
  for (const [name, role, start, end, wage] of [["Manager","manager","09:00","17:00",15],["Natakar 1","waiter","10:00","18:00",8],["Kuhar 1","chef","10:00","20:00",10]]) await create("shift", { staffName: name, role, date: today(), scheduledStart: start, scheduledEnd: end, hourlyWage: wage, isClockedIn: false, isCompleted: false });

  // Cash drawer
  console.log("💰 Cash drawer...");
  await create("cashdrawersession", { user: "Manager", openedAt: now(), openingFloat: 200.00, expectedCash: 200.00, isOpen: true });

  // Fiscal config
  console.log("📋 Fiscal config...");
  await create("fiscalconfig", { taxNumber: "12345678", businessUnit: "PRE", electronicDevice: "PRE1", lastInvoiceNumber: 0, controlSeq: 1, testMode: true, restaurantName: "Noro Lep Center", restaurantAddress: "Slovenska cesta 1, 1000 Ljubljana" });

  // Reservations
  console.log("📅 Reservations...");
  await create("reservation", { customerName: "Ana Kovac", customerPhone: "031234567", date: today(), time: "19:00", partySize: 4, status: "confirmed", source: "guest", confirmationCode: "ABC234" });
  await create("reservation", { customerName: "Boris Janez", customerPhone: "041987654", date: today(), time: "20:00", partySize: 2, status: "pending", source: "guest", confirmationCode: "XYZ789" });

  console.log("\n✅ Seed complete! Login: manager / m123456\n");
}

seed().catch((err) => { console.error("❌ Failed:", err); process.exit(1); });

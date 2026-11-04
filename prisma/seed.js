require('dotenv').config();
const { syncCars } = require('../src/services/carSyncService');
const prisma = require('../src/config/prisma');

syncCars()
  .then((n) => console.log(`Seeded ${n} cars`))
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
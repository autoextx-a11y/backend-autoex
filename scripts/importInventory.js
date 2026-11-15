
require("dotenv").config();

const prisma = require("../src/config/prisma");
const { run } = require("../src/services/inventoryImport");

const main = async () => {
  try {
    await run();
  } catch (error) {
    console.error("Inventory import failed:", error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
};

main();

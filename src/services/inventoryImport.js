
const fs = require("fs");
const path = require("path");
const { parse } = require("csv-parse/sync");

const prisma = require("../config/prisma");

const {
  mapDealer,
  mapVehicle,
} = require("./vehicleMapper");

const FEED_DIR = path.resolve(
  process.cwd(),
  process.env.FEED_DIR || "./feed"
);

const INBOX_DIR = path.join(FEED_DIR, "inbox");
const PROCESSED_DIR = path.join(FEED_DIR, "processed");
const FAILED_DIR = path.join(FEED_DIR, "failed");

const MIN_AGE_SECONDS = Number(
  process.env.FEED_MIN_AGE_SECONDS ?? 0
);

const MIN_RATIO = Number(
  process.env.FEED_MIN_RATIO ?? 0.2
);

const FULL_SNAPSHOT =
  String(process.env.FEED_FULL_SNAPSHOT).toLowerCase() === "true";

const ensureFolders = () => {
  fs.mkdirSync(INBOX_DIR, { recursive: true });
  fs.mkdirSync(PROCESSED_DIR, { recursive: true });
  fs.mkdirSync(FAILED_DIR, { recursive: true });
};

const getDestinationPath = (directory, fileName) => {
  const extension = path.extname(fileName);
  const baseName = path.basename(fileName, extension);

  let destination = path.join(directory, fileName);

  if (fs.existsSync(destination)) {
    destination = path.join(
      directory,
      `${baseName}_${Date.now()}${extension}`
    );
  }

  return destination;
};

const moveFile = (source, destinationDirectory) => {
  const destination = getDestinationPath(
    destinationDirectory,
    path.basename(source)
  );

  fs.renameSync(source, destination);

  return destination;
};

const readCsv = (filePath) => {
  // Windows-1252 supports the characters used in the feed.
  const buffer = fs.readFileSync(filePath);
  const content = new TextDecoder("windows-1252").decode(buffer);

  return parse(content, {
    columns: true,
    bom: true,
    skip_empty_lines: true,
    trim: true,
  });
};

const validateDealer = (dealer) => {
  if (!dealer.id || !Number.isInteger(dealer.id)) {
    throw new Error("Invalid or missing DealerID.");
  }

  if (!dealer.name) {
    throw new Error("Missing Dealer Name.");
  }
};

const processFile = async (
  filePath,
  { skipAgeCheck = false } = {}
) => {
  const fileName = path.basename(filePath);

  let importRun = null;
  let rowsRead = 0;
  let rowsSkipped = 0;
  let insertedCount = 0;
  let updatedCount = 0;

  try {
   if (!skipAgeCheck) {
  const fileAgeSeconds =
    (Date.now() - fs.statSync(filePath).mtimeMs) / 1000;

  if (fileAgeSeconds < MIN_AGE_SECONDS) {
    throw new Error(
      `File is too new. Wait ${Math.ceil(
        MIN_AGE_SECONDS - fileAgeSeconds
      )} more seconds.`
    );
  }
}

    const rows = readCsv(filePath);

    rowsRead = rows.length;

    if (rowsRead === 0) {
      throw new Error("CSV file contains no vehicle records.");
    }

    const mappedRows = [];
    const vins = new Set();

    let dealer = null;

    for (const row of rows) {
      try {
        const currentDealer = mapDealer(row);

        validateDealer(currentDealer);

        if (dealer && dealer.id !== currentDealer.id) {
          throw new Error(
            "This importer expects one dealer per CSV file."
          );
        }

        dealer = currentDealer;

        const vehicle = mapVehicle(row, currentDealer.id);

        if (vins.has(vehicle.vin)) {
          throw new Error(`Duplicate VIN: ${vehicle.vin}`);
        }

        vins.add(vehicle.vin);

        mappedRows.push(vehicle);
      } catch (error) {
        rowsSkipped++;
        console.warn(
          `Skipping CSV row: ${error.message}`
        );
      }
    }

    if (!dealer) {
      throw new Error("No valid dealer information found.");
    }

    if (mappedRows.length === 0) {
      throw new Error("No valid vehicles found in CSV.");
    }

    // Prevent an unexpectedly small feed from deactivating
    // a large portion of the current inventory.
    const existingCount = await prisma.car.count({
      where: {
        dealerId: dealer.id,
        isActive: true,
      },
    });

    if (
      FULL_SNAPSHOT &&
      existingCount > 0 &&
      mappedRows.length < Math.ceil(existingCount * MIN_RATIO)
    ) {
      throw new Error(
        `Feed safety check failed. Existing active cars: ${existingCount}, incoming valid cars: ${mappedRows.length}.`
      );
    }

    importRun = await prisma.importRun.create({
      data: {
        fileName,
        status: "RUNNING",
        rowsRead,
        rowsSkipped,
      },
    });
    // Database changes are committed together.
await prisma.$transaction(async (tx) => {
  await tx.dealer.upsert({
    where: {
      id: dealer.id,
    },
    update: {
      name: dealer.name,
      address: dealer.address,
      city: dealer.city,
      state: dealer.state,
      zip: dealer.zip,
      phone: dealer.phone,
    },
    create: dealer,
  });

  // Find existing VINs before updating.
  const incomingVins = mappedRows.map((vehicle) => vehicle.vin);

  const existingCars = await tx.car.findMany({
    where: {
      vin: {
        in: incomingVins,
      },
    },
    select: {
      vin: true,
    },
  });

  const existingVins = new Set(
    existingCars.map((car) => car.vin)
  );

  // Full snapshot: deactivate vehicles missing from this feed.
  if (FULL_SNAPSHOT) {
    await tx.car.updateMany({
      where: {
        dealerId: dealer.id,
      },
      data: {
        isActive: false,
      },
    });
  }

  for (const vehicle of mappedRows) {
    if (existingVins.has(vehicle.vin)) {
      updatedCount++;
    } else {
      insertedCount++;
    }

    await tx.car.upsert({
      where: {
        vin: vehicle.vin,
      },
      update: vehicle,
      create: vehicle,
    });
  }
});




    await prisma.importRun.update({
      where: {
        id: importRun.id,
      },
      data: {
        status: "SUCCESS",
        finishedAt: new Date(),
        rowsRead,
        rowsSkipped,
        message: `Successfully imported ${mappedRows.length} vehicles.`,
      },
    });

    const processedPath = moveFile(filePath, PROCESSED_DIR);

    console.log("--------------------------------");
    console.log(`File: ${fileName}`);
    console.log(`Imported: ${mappedRows.length} cars`);
    console.log(`Skipped: ${rowsSkipped} cars`);
    console.log(`Processed file: ${processedPath}`);
    console.log("--------------------------------");
    console.log(`New vehicles: ${insertedCount}`);
console.log(`Updated vehicles: ${updatedCount}`);
console.log(`Total processed: ${mappedRows.length}`);
console.log(`Skipped: ${rowsSkipped}`);

    return {
  imported: insertedCount,
  updated: updatedCount,
  skipped: rowsSkipped,
  rowsRead,
  message: `Successfully imported ${insertedCount} new vehicles and updated ${updatedCount} existing vehicles.`,
};

  } catch (error) {
    console.error(`Import failed for ${fileName}:`, error.message);

    if (importRun) {
      try {
        await prisma.importRun.update({
          where: {
            id: importRun.id,
          },
          data: {
            status: "FAILED",
            finishedAt: new Date(),
            rowsRead,
            rowsSkipped,
            message: error.message,
          },
        });
      } catch (updateError) {
        console.error(
          "Could not update ImportRun:",
          updateError.message
        );
      }
    }

    if (fs.existsSync(filePath)) {
      try {
        const failedPath = moveFile(filePath, FAILED_DIR);
        console.log(`Moved failed file to: ${failedPath}`);
      } catch (moveError) {
        console.error(
          "Could not move failed file:",
          moveError.message
        );
      }
    }

    throw error;
  }
};

const run = async () => {
  ensureFolders();

  const files = fs
    .readdirSync(INBOX_DIR)
    .filter((file) => file.toLowerCase().endsWith(".csv"))
    .sort();

  if (files.length === 0) {
    console.log("No CSV files found in feed/inbox.");
    return;
  }

  let totalImported = 0;
  let totalSkipped = 0;
  let failedFiles = 0;

  for (const file of files) {
    const filePath = path.join(INBOX_DIR, file);

    try {
      const result = await processFile(filePath);

      totalImported += result.imported;
      totalSkipped += result.skipped;
    } catch (error) {
      failedFiles++;
      console.error(`Failed file: ${file}`);
    }
  }

  console.log("========== IMPORT SUMMARY ==========");
  console.log(`Total imported: ${totalImported}`);
  console.log(`Total skipped: ${totalSkipped}`);
  console.log(`Failed files: ${failedFiles}`);
  console.log("====================================");

  if (failedFiles > 0) {
    throw new Error(`${failedFiles} inventory file(s) failed.`);
  }
};


module.exports = {
  run,
  processFile,
};

// const { processFile } = require("../services/inventoryImport");

// exports.uploadCsv = async (req, res, next) => {
//   try {
//     // Make sure a file was uploaded
//     if (!req.file) {
//       return res.status(400).json({
//         success: false,
//         message: "Please select a CSV file to upload.",
//       });
//     }

//     // Process the uploaded CSV immediately
//     const result = await processFile(req.file.path, {
//   skipAgeCheck: true,
// });

//     return res.status(200).json({
//       success: true,
//       message: "CSV uploaded and imported successfully.",
//       fileName: req.file.originalname,
//       results: {
//         imported: result.imported,
//         updated: result.updated,
//         skipped: result.skipped,
//         rowsRead: result.rowsRead,
//       },
//     });
//   } catch (error) {
//     console.error("Dealer CSV upload failed:", error.message);
//     next(error);
//   }
// };



const { processFile } = require("../services/inventoryImport");
const prisma = require("../config/prisma");

exports.uploadCsv = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please select a CSV file to upload.",
      });
    }

    const result = await processFile(req.file.path, {
      skipAgeCheck: true,
    });

    // TEMPORARY DATABASE DIAGNOSTICS
    const [dbInfo, totalCars, activeCars, targetVins] =
      await Promise.all([
        prisma.$queryRaw`
          SELECT
            current_database() AS database,
            current_user AS db_user,
            inet_server_addr()::text AS server_address,
            inet_server_port() AS server_port
        `,
        prisma.car.count(),
        prisma.car.count({ where: { isActive: true } }),
        prisma.car.findMany({
          where: {
            vin: {
              in: [
                "KM8KN4DE8RU292269",
                "KM8KN4DE8RU292268",
                "KM8KN4DE8RU292267",
              ],
            },
          },
          select: {
            id: true,
            vin: true,
            dealerId: true,
            isActive: true,
          },
        }),
      ]);

    console.log("========== CSV IMPORT DATABASE DIAGNOSTIC ==========");
    console.log("Database:", dbInfo);
    console.log("Total cars:", totalCars);
    console.log("Active cars:", activeCars);
    console.log("Target VINs:", targetVins);
    console.log("Import result:", result);
    console.log("=====================================================");

    return res.status(200).json({
      success: true,
      message: "CSV uploaded and imported successfully.",
      fileName: req.file.originalname,
      results: {
        imported: result.imported,
        updated: result.updated,
        skipped: result.skipped,
        rowsRead: result.rowsRead,
      },
    });
  } catch (error) {
    console.error("Dealer CSV upload failed:", error);
    next(error);
  }
};

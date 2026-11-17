
const { processFile } = require("../services/inventoryImport");

exports.uploadCsv = async (req, res, next) => {
  try {
    // Make sure a file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please select a CSV file to upload.",
      });
    }

    // Process the uploaded CSV immediately
    const result = await processFile(req.file.path, {
  skipAgeCheck: true,
});

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
    console.error("Dealer CSV upload failed:", error.message);
    next(error);
  }
};

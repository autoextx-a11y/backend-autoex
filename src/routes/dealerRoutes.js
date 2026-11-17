
const router = require("express").Router();

const upload = require("../middlewares/uploadMiddleware");
const dealerController = require("../controllers/dealerController");

router.post(
  "/upload-csv",
  upload.single("file"),
  dealerController.uploadCsv
);

module.exports = router;

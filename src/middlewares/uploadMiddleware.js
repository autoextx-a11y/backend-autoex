
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const FEED_DIR = path.resolve(
  process.cwd(),
  process.env.FEED_DIR || "./feed"
);

const INBOX_DIR = path.join(FEED_DIR, "inbox");

// Make sure inbox exists
fs.mkdirSync(INBOX_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, INBOX_DIR);
  },

  filename: (req, file, cb) => {
    const uniqueName =
      `inventory-${Date.now()}-${crypto.randomUUID()}.csv`;

    cb(null, uniqueName);
  },
});

const fileFilter = (req, file, cb) => {
  const extension = path.extname(file.originalname).toLowerCase();

  if (extension !== ".csv") {
    return cb(new Error("Only CSV files are allowed."));
  }

  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 25 * 1024 * 1024,
    files: 1,
  },
});

module.exports = upload;

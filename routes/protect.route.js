const express = require("express");
const multer = require("multer");
const { protectPDF } = require("../controller/protect.controller");

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.post("/", upload.single("pdfFile"), protectPDF);

module.exports = router;

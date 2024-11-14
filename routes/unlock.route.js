const express = require("express");
const multer = require("multer");
const { unlockPDF } = require("../controller/unlock.controller");

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.post("/", upload.single("file"), unlockPDF);

module.exports = router;

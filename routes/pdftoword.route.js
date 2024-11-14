const express = require("express");
const multer = require("multer");
const {
  uploadFile,
  convertFile,
  checkStatus,
  downloadFile,
  cloudinaryUploader,
} = require("../controller/pdftoword.controller.js");

const router = express.Router();
const upload = multer({ dest: "/tmp/" }); // Temp storage location

// Apply multer middleware in the upload route
router.post("/upload", upload.single("file"), uploadFile);
router.post("/convert", convertFile);
router.get("/status", checkStatus);
router.get("/download", downloadFile);
router.get("/cloud/upload", cloudinaryUploader);

module.exports = router;

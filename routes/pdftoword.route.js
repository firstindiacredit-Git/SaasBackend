const express = require("express");
const {
  uploadFile,
  convertFile,
  checkStatus,
  downloadFile,
  cloudinaryUploader,
} = require("../controller/pdftoword.controller.js");

const router = express.Router();

router.post("/upload", uploadFile);
router.post("/convert", convertFile);
router.get("/status", checkStatus);
router.get("/download", downloadFile);
router.get("/cloud/upload", cloudinaryUploader);

module.exports = router;

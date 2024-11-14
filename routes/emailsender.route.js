const express = require("express");
const { sendEmail } = require("../controller/emailsender.controller.js");

const router = express.Router();

router.post("/", sendEmail);

module.exports = router;

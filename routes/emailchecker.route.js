const express = require("express");
const { validateEmails } = require("../controller/emailchecker.controller.js");

const router = express.Router();

router.post("/", validateEmails);

module.exports = router;

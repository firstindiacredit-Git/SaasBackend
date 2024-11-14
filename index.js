require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const fileUpload = require("express-fileupload");
const protectRoute = require("./routes/protect.route.js");
const unlockRoute = require("./routes/unlock.route.js");
const emailSenderRoute = require("./routes/emailsender.route.js");
const pdfToWordRoute = require("./routes/pdftoword.route.js");
const emailCheckerRoute = require("./routes/emailchecker.route.js");


const app = express();
const PORT = 4000;

app.use(cors());
app.use(express.json());
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(fileUpload({ useTempFiles: true, tempFileDir: "/tmp/" }));
app.use((err, req, res, next) => {
    res.status(err.code || 500).json({ message: err.message || "Internal Server Error" });
  });

app.use("/protect", protectRoute);
app.use("/unlock-pdf", unlockRoute);
app.use("/send-email", emailSenderRoute);
app.use("/api/file", pdfToWordRoute);
app.use("/validate", emailCheckerRoute);

app.get("/", (req, res) => {
    res.send("Welcome to SaasBackend");
  });



app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

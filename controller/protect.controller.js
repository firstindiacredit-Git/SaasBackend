const { exec } = require("child_process");
const path = require("path");
const fs = require("fs");

const protectPDF = (req, res) => {
  const { password } = req.body;
  const inputPath = req.file.path;
  const outputPath = path.join("uploads", `protected_${req.file.originalname}`);

  const command = `qpdf --encrypt ${password} ${password} 256 -- ${inputPath} ${outputPath}`;
  exec(command, (error) => {
    if (error) {
      console.error("Error encrypting PDF:", error);
      return res.status(500).send("Error encrypting PDF");
    }

    res.download(outputPath, (err) => {
      if (err) console.error("Error sending file:", err);
      fs.unlinkSync(inputPath);
      fs.unlinkSync(outputPath);
    });
  });
};

module.exports = { protectPDF };

const { exec } = require("child_process");
const path = require("path");
const fs = require("fs");

const unlockPDF = (req, res) => {
  const inputPath = req.file.path;
  const outputPath = path.join("uploads", `unlocked_${req.file.filename}.pdf`);
  const password = req.body.password || ""; // Get the password if provided

  const command = password
    ? `qpdf --decrypt --password="${password}" "${inputPath}" "${outputPath}"`
    : `qpdf --decrypt "${inputPath}" "${outputPath}"`;

  exec(command, (error) => {
    if (error) {
      console.error("Error unlocking PDF:", error);
      return res.status(500).json({ error: "Error unlocking PDF. Please check the password and try again." });
    }

    // Send the unlocked PDF to the client
    res.download(outputPath, "unlocked.pdf", (err) => {
      if (err) console.error("Error sending file:", err);

      // Clean up temporary files
      fs.unlinkSync(inputPath);
      fs.unlinkSync(outputPath);
    });
  });
};

module.exports = { unlockPDF };

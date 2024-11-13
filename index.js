const express = require('express');
const cors = require('cors');
//const axios = require('axios');
const multer = require('multer');
const { exec } = require("child_process");
const fs = require('fs');
const path = require('path');
const dotenv = require("dotenv");
dotenv.config();
const fileUpload = require("express-fileupload");
const cloudinary = require("cloudinary").v2;
const axios = require("axios");
const FormData = require("form-data");

const app = express();
app.use(cors());
const upload = multer({ dest: 'uploads/' });


app.post("/protect", upload.single("pdfFile"), (req, res) => {
    const { password } = req.body;
    const inputPath = req.file.path;
    const outputPath = path.join("uploads", `protected_${req.file.originalname}`);
  
    // Using qpdf to add password protection
    const command = `qpdf --encrypt ${password} ${password} 256 -- ${inputPath} ${outputPath}`;
    exec(command, (error) => {
      if (error) {
        console.error("Error encrypting PDF:", error);
        return res.status(500).send("Error encrypting PDF");
      }
  
      res.download(outputPath, (err) => {
        if (err) console.error("Error sending file:", err);
        // Clean up uploaded files
        fs.unlinkSync(inputPath);
        fs.unlinkSync(outputPath);
      });
    });
  });
  
  
  //for Unlock pdf
  app.post("/unlock-pdf", upload.single("file"), (req, res) => {
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
  });


 //pdf to word code

 class CustomError extends Error {
  constructor(message, code) {
      super(message);
      this.code = code;
  }
}
  
const BigPromise = (func) => (req, res, next) => {
  Promise.resolve(func(req, res, next)).catch(next);
};

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});


app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(fileUpload({
    useTempFiles: true,
    tempFileDir: "/tmp/",
}));

// Controller functions
const uploadFile = BigPromise(async (req, res, next) => {
    if (!req.files) return next(new CustomError("Please provide a file", 400));

    const form = fs.createReadStream(`${req.files.file.tempFilePath}`);
    const data = new FormData();
    data.append("file", form);

    const options = {
        method: "POST",
        url: "https://api.conversiontools.io/v1/files",
        headers: {
            Authorization: process.env.API_TOKEN,
            "Content-Type": "multipart/form-data",
        },
        data: data,
    };

    axios.request(options)
        .then(response => {
            res.status(200).json({ success: true, file_id: response.data.file_id });
        })
        .catch(err => next(new CustomError("File upload failed", 400)));
});

const convertFile = BigPromise((req, res, next) => {
    if (!req.query) return next(new CustomError("No fileId found in query", 400));

    const options = {
        method: "POST",
        url: "https://api.conversiontools.io/v1/tasks",
        headers: {
            Authorization: process.env.API_TOKEN,
            "Content-Type": "application/json",
        },
        data: JSON.stringify({ type: "convert.pdf_to_word", file_id: req.query.fileId }),
    };

    axios.request(options)
        .then(response => res.status(200).json({ success: true, task_id: response.data.task_id }))
        .catch(() => next(new CustomError("Conversion failed", 400)));
});

const checkStatus = BigPromise((req, res, next) => {
    if (!req.query) return next(new CustomError("task_id not found", 400));

    const setIntervalId = setInterval(() => {
        const options = {
            method: "GET",
            url: `https://api.conversiontools.io/v1/tasks/${req.query.taskId}`,
            headers: { Authorization: process.env.API_TOKEN, "Content-Type": "application/json" },
        };

        axios.request(options)
            .then(response => {
                if (response.data.status === "SUCCESS" || response.data.status === "ERROR") {
                    if (response.data.status === "SUCCESS") {
                        res.status(200).json({ file_id: response.data.file_id, status: "SUCCESS" });
                    } else {
                        next(new CustomError("Conversion failed", 400));
                    }
                    clearInterval(setIntervalId);
                }
            })
            .catch(() => {
                clearInterval(setIntervalId);
                next(new CustomError("Conversion status failed", 400));
            });
    }, 4000);
});

const downloadFile = BigPromise((req, res, next) => {
    if (!req.query) return next(new CustomError("no fileId found in url", 400));

    const options = {
        method: "get",
        url: `https://api.conversiontools.io/v1/files/${req.query.fileId}`,
        headers: { Authorization: process.env.API_TOKEN },
        responseType: "stream",
    };

    axios.request(options)
        .then(response => {
            const fileName = response.headers["content-disposition"]
                .split(";")
                .find(n => n.includes("filename="))
                .replace("filename=", "")
                .trim().split('"')[1];

            response.data.pipe(fs.createWriteStream(`/tmp/${fileName}`));
            res.status(200).json({ fileName });
        })
        .catch(() => next(new CustomError("Download file failed", 400)));
});

const cloudinaryUploader = BigPromise(async (req, res, next) => {
    if (!req.query) return next(new CustomError("no fileName found in url", 400));

    const result = await cloudinary.uploader.upload(`/tmp/${req.query.fileName}`, {
        folder: "docs",
        resource_type: "raw",
    });

    res.status(200).json({ success: true, file_url: result.secure_url });
});

// Routes setup
app.post("/api/file/upload", uploadFile);
app.post("/api/file/convert", convertFile);
app.get("/api/file/status", checkStatus);
app.get("/api/file/download", downloadFile);
app.get("/api/file/cloud/upload", cloudinaryUploader);

// Root route
app.get('/', (req, res) => {
    res.send("Welcome to PDF to Word Converter API!");
});

// Error handling middleware
app.use((err, req, res, next) => {
    res.status(err.code || 500).json({ message: err.message || "Internal Server Error" });
});

  
  
  
  app.listen(process.env.PORT, () => {
    console.log(`CORS Proxy Server running on port ${process.env.PORT}`);
  });
  
  


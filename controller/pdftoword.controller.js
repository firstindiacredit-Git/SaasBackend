const cloudinary = require("cloudinary").v2;
const axios = require("axios");
const fs = require("fs");
const FormData = require("form-data");
const multer = require("multer");

// Set up multer to store files temporarily in /tmp/
const upload = multer({ dest: "/tmp/" });

// Custom error class
class CustomError extends Error {
  constructor(message, code) {
    super(message);
    this.code = code;
  }
}

// Async wrapper for handling errors
const BigPromise = (func) => (req, res, next) => {
  Promise.resolve(func(req, res, next)).catch(next);
};

// Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// // Upload file function
// const uploadFile = BigPromise(async (req, res, next) => {
//   if (!req.files) return next(new CustomError("Please provide a file", 400));

//   const form = fs.createReadStream(`${req.files.file.tempFilePath}`);
//   const data = new FormData();
//   data.append("file", form);

//   const options = {
//     method: "POST",
//     url: "https://api.conversiontools.io/v1/files",
//     headers: {
//       Authorization: process.env.API_TOKEN,
//       "Content-Type": "multipart/form-data",
//     },
//     data: data,
//   };

//   axios.request(options)
//     .then(response => {
//       res.status(200).json({ success: true, file_id: response.data.file_id });
//     })
//     .catch(() => next(new CustomError("File upload failed", 400)));
// });

// Upload file function using multer
const uploadFile = BigPromise(async (req, res, next) => {
  if (!req.file) return next(new CustomError("Please provide a file", 400));

  const form = fs.createReadStream(req.file.path);
  const data = new FormData();
  data.append("file", form);

  const options = {
    method: "POST",
    url: "https://api.conversiontools.io/v1/files",
    headers: {
      Authorization: process.env.API_TOKEN,
      ...data.getHeaders(), // Use FormData's custom headers
    },
    data: data,
  };

  axios
    .request(options)
    .then((response) => {
      res.status(200).json({ success: true, file_id: response.data.file_id });
    })
    .catch(() => next(new CustomError("File upload failed", 400)))
    .finally(() => {
      fs.unlinkSync(req.file.path); // Clean up the temporary file
    });
});

// Convert file function
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

// Check status function
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
  }, 5000);
});

// Download file function
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

// Cloudinary upload function
const cloudinaryUploader = BigPromise(async (req, res, next) => {
  if (!req.query) return next(new CustomError("no fileName found in url", 400));

  const result = await cloudinary.uploader.upload(`/tmp/${req.query.fileName}`, {
    folder: "docs",
    resource_type: "raw",
  });

  res.status(200).json({ success: true, file_url: result.secure_url });
});

module.exports = {
  uploadFile,
  convertFile,
  checkStatus,
  downloadFile,
  cloudinaryUploader,
};

// const multer = require('multer');
// const multerS3 = require('multer-s3');
// const { S3Client } = require('@aws-sdk/client-s3');
// const path = require('path');
// const dotenv = require("dotenv");

// dotenv.config();

// // Initialize AWS S3 Client (v3)
// const s3 = new S3Client({
//   region: process.env.AWS_REGION,
//   credentials: {
//     accessKeyId: process.env.AWS_ACCESS_KEY,
//     secretAccessKey: process.env.AWS_SECRET_KEY,
//   },
// });

// // File filter to check allowed file types
// const fileFilter = (req, file, cb) => {
//   const fileTypes = /jpeg|jpg|png|gif|pdf|doc|docx|xls|xlsx/;
//   const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
//   const mimetype = fileTypes.test(file.mimetype);

//   if (extname && mimetype) {
//     return cb(null, true);
//   } else {
//     cb(new Error('Only images, PDFs, DOC, DOCX, XLS, and XLSX files are allowed!'));
//   }
// };

// // Configure Multer storage for Employee
// const saasPdfStorage = multerS3({
//   s3: s3,
//   bucket: process.env.AWS_BUCKET_NAME,
//   acl: 'public-read',  // Set ACL to public-read
//   key: function (req, file, cb) {
//     const uniqueSuffix = Date.now() + '-' + file.originalname;
//     console.log("Uploading file:", 'uploads/employee/' + file.fieldname + '-' + uniqueSuffix);
//     cb(null, 'uploads/saaspdf/' + file.fieldname + '-' + uniqueSuffix);
//   }
// });

// // Create Multer instances for each type of file upload
// const uploadSaasPdf = multer({ storage: saasPdfStorage, fileFilter: fileFilter });


// module.exports = { uploadSaasPdf };




// //

const multer = require('multer');
const multerS3 = require('multer-s3');
const { S3Client } = require('@aws-sdk/client-s3');
const path = require('path');
const dotenv = require("dotenv");

dotenv.config();

// Initialize AWS S3 Client
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
  },
});

// File filter to check allowed file types
const fileFilter = (req, file, cb) => {
  const fileTypes = /jpeg|jpg|png|gif|pdf|doc|docx|xls|xlsx/;
  const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = fileTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Only images, PDFs, DOC, DOCX, XLS, and XLSX files are allowed!'));
  }
};

// Configure Multer storage for Employee
const saasPdfStorage = multerS3({
  s3: s3,
  bucket: process.env.AWS_BUCKET_NAME,
  acl: 'private',
  key: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + file.originalname;
    cb(null, 'uploads/saaspdf/' + file.fieldname + '-' + uniqueSuffix);
  }
});

const uploadSaasPdf = multer({ storage: saasPdfStorage, fileFilter: fileFilter });

module.exports = { uploadSaasPdf };

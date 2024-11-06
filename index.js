// const express = require('express');
// const cors = require('cors');
// //const axios = require('axios');
// const multer = require('multer');
// const { exec } = require("child_process");
// //const cloudconvert = new (require('cloudconvert'))('eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIxIiwianRpIjoiNTIyOWNlYjRkYzAxMDUxZGU4YzEzZWY3MjY4YzRjYjMxYjg4ODhiYTFiODM5M2UwYzRjM2QxZGJkOTViMzc3MWE0NTE2YTUyMzEwYTBhOGEiLCJpYXQiOjE3Mjg5MDIxMTMuMjU5MzIyLCJuYmYiOjE3Mjg5MDIxMTMuMjU5MzIzLCJleHAiOjQ4ODQ1NzU3MTMuMjUyNTY4LCJzdWIiOiI2OTg3NTY4OSIsInNjb3BlcyI6W119.ImpTJP6IyQuGcpKNtbfnXGm4vbGAJXwfHvZDXPjy5qLoUgTh8nnd4x9oLH1gTtBRUcyuTs9RrDutG6dMt3DybYtLwThUToH9yvaGN0bJJ9t-xTKdPHC3gFW2xA28mVKCrjOZngAmPWfD2VnZXhJA6M3a7OYyWWDN8k3ZFcAfkzZJrhlUtFP3XuETu7hpGew81X8Nnya95S99F8SzV2BDK1xZRxjFXRU9MPaC-FSkHyGHRZPrcUQU-6yzU4RjcRnId96mswPou-2vRfY98jPu9ZzC9gGMFPGtFXbv6b0n82Qsnjrayzu26H4RGg47oNk4sD7XUcmjsjsryhOE4aXKdqTZfBr2VGt3ekWCcLg1bs_FtgptVgvv1YACo7D00C8wmEq3JKfii_AplayPtxXCRl6iZ-WI4tdkUzPG-QCu58jx-Fq7Divuu4w1BkNUeU9iFFi-55pbXm6Qwrirl6HnleXTGsf85xPk1kdlENK4QIPAk838cBatghbfCvXmOEbf5ECO8x-7i8_39n4R8YqqHwf6Wtue3Do7GRZLmUVMatPi7HHv1gaUSGNVH94ydrwb0LsqLA9KtQ5mYP_3Y4B_5w1uvBbykhvWttaPRATaHlpoNPUxIaTShcHyyZSGuv2NGkP_qzbhfNBWSE0Z3-Qt8TZpAxeqJH9vJZZp4r4YLjk');
// const fs = require('fs');
// const path = require('path');

// const app = express();
// app.use(cors());
// const upload = multer({ dest: 'uploads/' });


// app.post("/protect", upload.single("pdfFile"), (req, res) => {
//     const { password } = req.body;
//     const inputPath = req.file.path;
//     const outputPath = path.join("uploads", `protected_${req.file.originalname}`);
  
//     // Using qpdf to add password protection
//     const command = `qpdf --encrypt ${password} ${password} 256 -- ${inputPath} ${outputPath}`;
//     exec(command, (error) => {
//       if (error) {
//         console.error("Error encrypting PDF:", error);
//         return res.status(500).send("Error encrypting PDF");
//       }
  
//       res.download(outputPath, (err) => {
//         if (err) console.error("Error sending file:", err);
//         // Clean up uploaded files
//         fs.unlinkSync(inputPath);
//         fs.unlinkSync(outputPath);
//       });
//     });
//   });
  
  
//   //for Unlock pdf
//   app.post("/unlock-pdf", upload.single("file"), (req, res) => {
//     const inputPath = req.file.path;
//     const outputPath = path.join("uploads", `unlocked_${req.file.filename}.pdf`);
//     const password = req.body.password || ""; // Get the password if provided
  
//     const command = password
//       ? `qpdf --decrypt --password="${password}" "${inputPath}" "${outputPath}"`
//       : `qpdf --decrypt "${inputPath}" "${outputPath}"`;
  
//     exec(command, (error) => {
//       if (error) {
//         console.error("Error unlocking PDF:", error);
//         return res.status(500).json({ error: "Error unlocking PDF. Please check the password and try again." });
//       }
  
//       // Send the unlocked PDF to the client
//       res.download(outputPath, "unlocked.pdf", (err) => {
//         if (err) console.error("Error sending file:", err);
  
//         // Clean up temporary files
//         fs.unlinkSync(inputPath);
//         fs.unlinkSync(outputPath);
//       });
//     });
//   });
  
  
  
  
//   app.listen(8080, () => {
//     console.log('CORS Proxy Server running on port 8080');
//   });
  
  

// const express = require('express');
// const cors = require('cors');
// const multer = require('multer');
// const { exec } = require("child_process");
// const fs = require('fs');
// const path = require('path');
// const dotenv = require("dotenv");
// dotenv.config();

// const { uploadSaasPdf } = require('./multerConfig1');
// const { S3Client, GetObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3');
// const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

// // Initialize S3 client
// const s3 = new S3Client({
//   region: process.env.AWS_REGION,
//   credentials: {
//     accessKeyId: process.env.AWS_ACCESS_KEY,
//     secretAccessKey: process.env.AWS_SECRET_KEY,
//   },
// });

// const app = express();
// app.use(cors());

// app.post("/protect", uploadSaasPdf.single("pdfFile"), async (req, res) => {
//   const { password } = req.body;
//   const inputPath = `/tmp/${req.file.originalname}`;
//   const outputPath = `/tmp/protected_${req.file.originalname}`;

//   // Download file from S3
//   const downloadParams = {
//     Bucket: process.env.AWS_BUCKET_NAME,
//     Key: req.file.key,
//   };

//   const downloadCommand = new GetObjectCommand(downloadParams);
//   const downloadStream = (await s3.send(downloadCommand)).Body;

//   // Write the downloaded file to the local system
//   const fileStream = fs.createWriteStream(inputPath);
//   downloadStream.pipe(fileStream);

//   fileStream.on("finish", () => {
//     // Encrypt the PDF file using qpdf
//     const command = `qpdf --encrypt ${password} ${password} 256 -- ${inputPath} ${outputPath}`;
//     exec(command, async (error) => {
//       if (error) {
//         console.error("Error encrypting PDF:", error);
//         return res.status(500).send("Error encrypting PDF");
//       }

//       // Upload protected file to S3
//       try {
//         const fileContent = fs.readFileSync(outputPath);
//         const uploadParams = {
//           Bucket: process.env.AWS_BUCKET_NAME,
//           Key: `uploads/saaspdf/protected_${req.file.originalname}`,
//           Body: fileContent,
//           ContentType: 'application/pdf'
//         };

//         await s3.send(new PutObjectCommand(uploadParams));

//         // Generate temporary URL for download
//         const getObjectParams = {
//           Bucket: process.env.AWS_BUCKET_NAME,
//           Key: `uploads/saaspdf/protected_${req.file.originalname}`
//         };
//         const url = await getSignedUrl(s3, new GetObjectCommand(getObjectParams), { expiresIn: 3600 });

//         // Clean up temp files
//         fs.unlinkSync(inputPath);
//         fs.unlinkSync(outputPath);

//         res.json({ url });
//       } catch (err) {
//         console.error("Error uploading to S3:", err);
//         res.status(500).send("Error uploading protected PDF");
//       }
//     });
//   });
// });

// app.post("/unlock-pdf", uploadSaasPdf.single("file"), async (req, res) => {
//     const inputPath = `/tmp/${req.file.filename}`;
//     const outputPath = `/tmp/unlocked_${req.file.filename}.pdf`;
//     const password = req.body.password || ""; // Get the password if provided
    
//     const command = password
//       ? `qpdf --decrypt --password="${password}" "${inputPath}" "${outputPath}"`
//       : `qpdf --decrypt "${inputPath}" "${outputPath}"`;
    
//     exec(command, (error) => {
//       if (error) {
//         console.error("Error unlocking PDF:", error);
//         return res.status(500).json({ error: "Error unlocking PDF. Please check the password and try again." });
//       }
    
//       // Send the unlocked PDF to the client
//       res.download(outputPath, "unlocked.pdf", (err) => {
//         if (err) console.error("Error sending file:", err);
    
//         // Clean up temporary files
//         fs.unlinkSync(inputPath);
//         fs.unlinkSync(outputPath);
//       });
//     });
//   });

// app.listen(8080, () => {
//   console.log('CORS Proxy Server running on port 8080');
// });


const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { exec } = require("child_process");
const fs = require('fs');
const path = require('path');
const dotenv = require("dotenv");
dotenv.config();

const { uploadSaasPdf } = require('./multerConfig1');
const { S3Client, GetObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

// Initialize S3 client
const s3 = new S3Client({
  region: process.env.BACKEND_REGION,
  credentials: {
    accessKeyId: process.env.BACKEND_ACCESS_KEY,
    secretAccessKey: process.env.BACKEND_SECRET_KEY,
  },
});

const app = express();
app.use(cors());

app.post("/protect", uploadSaasPdf.single("pdfFile"), async (req, res) => {
  const { password } = req.body;
  const inputPath = `/tmp/${req.file && req.file.originalname ? req.file.originalname : Date.now() + '_input.pdf'}`;
  const outputPath = `/tmp/protected_${Date.now()}.pdf`;

  try {
    // Download file from S3
    const downloadParams = {
      Bucket: process.env.BACKEND_BUCKET_NAME,
      Key: req.file.key,
    };

    const downloadCommand = new GetObjectCommand(downloadParams);
    const downloadStream = (await s3.send(downloadCommand)).Body;

    // Write the downloaded file to the local system
    const fileStream = fs.createWriteStream(inputPath);
    downloadStream.pipe(fileStream);

    fileStream.on("finish", () => {
      if (!fs.existsSync(inputPath)) {
        console.error("File not found after download:", inputPath);
        return res.status(500).send("Error: File could not be downloaded from S3.");
      }

      // Encrypt the PDF file using qpdf
      const command = `qpdf --encrypt ${password} ${password} 256 -- ${inputPath} ${outputPath}`;
      exec(command, async (error) => {
        if (error) {
          console.error("Error encrypting PDF:", error);
          return res.status(500).send("Error encrypting PDF");
        }

        // Upload protected file to S3
        try {
          const fileContent = fs.readFileSync(outputPath);
          const uploadParams = {
            Bucket: process.env.BACKEND_BUCKET_NAME,
            Key: `uploads/saaspdf/protected_${req.file.originalname}`,
            Body: fileContent,
            ContentType: 'application/pdf'
          };

          await s3.send(new PutObjectCommand(uploadParams));

          // Generate temporary URL for download
          const getObjectParams = {
            Bucket: process.env.BACKEND_BUCKET_NAME,
            Key: `uploads/saaspdf/protected_${req.file.originalname}`
          };
          const url = await getSignedUrl(s3, new GetObjectCommand(getObjectParams), { expiresIn: 3600 });

          // Clean up temp files
          fs.unlinkSync(inputPath);
          fs.unlinkSync(outputPath);

          res.json({ url });
        } catch (err) {
          console.error("Error uploading to S3:", err);
          res.status(500).send("Error uploading protected PDF");
        }
      });
    });

    fileStream.on("error", (err) => {
      console.error("Error writing to file:", err);
      res.status(500).send("Error writing file to local storage.");
    });
  } catch (error) {
    console.error("Error downloading file from S3:", error);
    res.status(500).send("Error downloading file from S3.");
  }
});



// Route to unlock PDF
app.post("/unlock-pdf", uploadSaasPdf.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  const s3Key = req.file.location.split(".com/")[1]; // Extract the key after the S3 bucket URL
  const localInputPath = `/tmp/${req.file.originalname}`;
  const localOutputPath = `/tmp/unlocked_${req.file.originalname}`;
  const password = req.body.password || "";

  try {
    // Step 1: Download the file from S3 to local
    const getObjectParams = {
      Bucket: process.env.BACKEND_BUCKET_NAME,
      Key: s3Key,
    };
    const data = await s3.send(new GetObjectCommand(getObjectParams));
    const writeStream = fs.createWriteStream(localInputPath);
    await new Promise((resolve, reject) => {
      data.Body.pipe(writeStream);
      data.Body.on("end", resolve);
      data.Body.on("error", reject);
    });

    // Step 2: Run qpdf to decrypt the PDF
    const command = password
      ? `qpdf --decrypt --password="${password}" "${localInputPath}" "${localOutputPath}"`
      : `qpdf --decrypt "${localInputPath}" "${localOutputPath}"`;

    exec(command, async (error) => {
      if (error) {
        console.error("Error unlocking PDF:", error);
        return res.status(500).json({ error: "Error unlocking PDF. Please check the password and try again." });
      }

      try {
        const fileContent = fs.readFileSync(localOutputPath);

        // Step 3: Upload the decrypted file back to S3
        const uploadParams = {
          Bucket: process.env.BACKEND_BUCKET_NAME,
          Key: `uploads/saaspdf/unlocked_${req.file.originalname}`,
          Body: fileContent,
          ContentType: "application/pdf",
        };
        await s3.send(new PutObjectCommand(uploadParams));

        // Step 4: Get a signed URL for the decrypted file
        const unlockedFileKey = `uploads/saaspdf/unlocked_${req.file.originalname}`;
        const signedUrlParams = {
          Bucket: process.env.BACKEND_BUCKET_NAME,
          Key: unlockedFileKey,
        };
        const url = await getSignedUrl(s3, new GetObjectCommand(signedUrlParams), { expiresIn: 3600 });

        // Cleanup local files
        fs.unlinkSync(localInputPath);
        fs.unlinkSync(localOutputPath);

        res.json({ url });
      } catch (err) {
        console.error("Error uploading unlocked PDF to S3:", err);
        res.status(500).send("Error uploading unlocked PDF");
      }
    });
  } catch (err) {
    console.error("Error downloading PDF from S3:", err);
    res.status(500).send("Error downloading PDF");
  }
});

app.listen(8080, () => {
  console.log('CORS Proxy Server running on port 8080');
});

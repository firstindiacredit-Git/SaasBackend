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
const bodyParser = require('body-parser');
const verifier = require('email-verify');
const nodemailer = require('nodemailer');
const xlsx = require('xlsx');
const { chromium } = require('playwright');


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

// Email checker code

app.use(express.json()); // For parsing application/json
app.use(express.urlencoded({ extended: true })); // For parsing application/x-www-form-urlencoded

// Route to validate multiple emails
app.post('/validate', (req, res) => {
  const emails = req.body.emails; // Array of emails
  const results = [];

  // Loop through each email to verify
  emails.forEach((email, index) => {
    verifier.verify(email, function (err, info) {
      results.push({
        email: email,
        success: info.success
      });

      // Send response when all emails are processed
      if (index === emails.length - 1) {
        res.json(results);
      }
    });
  });
});


// Bulk Email Sender

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'sinodkr001@gmail.com', // Your Gmail
      pass: 'erbv jtgo diak pebm'   // Your Gmail App Password (Enable 2FA and use App-specific password)
    }
  });
  
  // Send email to multiple recipients
  app.post('/send-email', async (req, res) => {
    const { emails, subject, message } = req.body;
  
    const mailOptions = {
      from: 'sinodkr001@gmail.com', 
      to: emails.join(', '),  // Join all emails in a comma-separated string
      subject: subject,
      text: message
    };
  
    try {
      await transporter.sendMail(mailOptions);
      res.status(200).json({ success: true, message: 'Emails sent successfully' });
    } catch (error) {
      console.error('Error sending emails:', error);
      res.status(500).json({ success: false, message: 'Failed to send emails', error });
    }
  });


  //Google Map Extractor code

  async function scrapeGoogleMaps(query, total = 100) {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    page.setDefaultTimeout(6000); // Set default timeout to 60 seconds
    await page.goto('https://www.google.com/maps');

    // Perform the search
    await page.fill('#searchboxinput', query);
    await page.keyboard.press('Enter');
    await page.waitForSelector('a[href*="https://www.google.com/maps/place"]', { timeout: 3000 });

    let scrapedData = [];
    let scrollAttempts = 0;
    let prevListingsCount = 0;

    while (scrapedData.length < total && scrollAttempts < 30) {
        let listings = await page.$$('a[href*="https://www.google.com/maps/place"]');
        console.log(`Found ${listings.length} listings after scroll attempt ${scrollAttempts + 1}`);

        for (let i = 0; i < listings.length; i++) {
            if (scrapedData.length >= total) break;

            let retries = 0;
            while (retries < 3) {
                try {
                    await listings[i].click();
                    await page.waitForTimeout(2000);  // Wait for page to load

                    const business = {};

                    // Fetch name from the `aria-label` attribute
                    business.name = await listings[i].getAttribute('aria-label').catch(() => 'N/A');

                    // Scrape other details
                    business.address = await page.$eval('button[data-item-id="address"] div', el => el.textContent.trim()).catch(() => 'N/A');
                    business.phone = await page.$eval('button[data-item-id^="phone:tel:"] div', el => el.textContent.trim()).catch(() => 'N/A');
                    business.website = await page.$eval('a[data-item-id="authority"] div', el => el.textContent.trim()).catch(() => 'N/A');

                    // Scrape reviews count (if needed)
                    // business.reviews = await page.$eval('//button[@jsaction="pane.reviewChart.moreReviews"]//span', el => el.textContent.trim()).catch(() => 'N/A');

                    // Scrape ratings (if needed)
                    business.rating = await page.$eval('//div[@jsaction="pane.reviewChart.moreReviews"]//div[@role="img"]', el => el.getAttribute('aria-label')).catch(() => 'N/A');

                    scrapedData.push(business);
                    break;
                } catch (error) {
                    console.error(`Error processing listing ${i + 1}:`, error);
                    retries++;
                    if (retries >= 3) {
                        console.log(`Skipping listing ${i + 1} after multiple errors.`);
                        break;
                    }
                }
            }
        }

        if (scrapedData.length >= total) break;

        prevListingsCount = listings.length;
        await page.mouse.wheel(0, 1000);
        await page.waitForTimeout(600);

        listings = await page.$$('a[href*="https://www.google.com/maps/place"]');
        if (listings.length === prevListingsCount) {
            console.log('No more new listings loaded, stopping...');
            break;
        }

        scrollAttempts++;
    }

    await browser.close();
    return scrapedData;
}

// Route to handle scraping request
app.post('/scrape', async (req, res) => {
    const { query, total } = req.body;
    try {
        const data = await scrapeGoogleMaps(query, total);

        // Generate Excel file from data
        const workbook = xlsx.utils.book_new();
        const worksheet = xlsx.utils.json_to_sheet(data);
        xlsx.utils.book_append_sheet(workbook, worksheet, 'Results');

        // Save Excel file temporarily
        const filePath = path.join(__dirname, 'output.xlsx');
        xlsx.writeFile(workbook, filePath);

        // Send file as a response
        res.download(filePath, 'google_maps_data.xlsx', (err) => {
            if (err) {
                console.error('Error sending file:', err);
                res.status(500).send('Could not send file');
            }
            // Clean up by deleting the file after sending
            fs.unlinkSync(filePath);
        });
    } catch (error) {
        console.error('Scraping failed', error);
        res.status(500).json({ error: 'Scraping failed' });
    }
});
  




app.listen(process.env.PORT, () => {
    console.log(`CORS Proxy Server running on port ${process.env.PORT}`);
});




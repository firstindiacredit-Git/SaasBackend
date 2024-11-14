const nodemailer = require("nodemailer");

// Configure Nodemailer transport for Gmail
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "sinodkr001@gmail.com", // Your Gmail
    pass: "erbv jtgo diak pebm"   // Your Gmail App Password
  }
});

const sendEmail = async (req, res) => {
  const { emails, subject, message } = req.body;

  const mailOptions = {
    from: "sinodkr001@gmail.com",
    to: emails.join(", "), // Join all emails into a comma-separated string
    subject: subject,
    text: message
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).json({ success: true, message: "Emails sent successfully" });
  } catch (error) {
    console.error("Error sending emails:", error);
    res.status(500).json({ success: false, message: "Failed to send emails", error });
  }
};

module.exports = { sendEmail };

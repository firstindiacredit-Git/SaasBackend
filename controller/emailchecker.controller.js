const verifier = require("email-verify");

// Controller function to validate multiple emails
const validateEmails = (req, res) => {
  const emails = req.body.emails; // Array of emails
  const results = [];

  // Verify each email and push the result to results array
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
};

module.exports = { validateEmails };

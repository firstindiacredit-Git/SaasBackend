// const verifier = require("email-verify");

// // Controller function to validate multiple emails
// const validateEmails = (req, res) => {
//   const emails = req.body.emails; // Array of emails
//   const results = [];

//   // Verify each email and push the result to results array
//   emails.forEach((email, index) => {
//     verifier.verify(email, function (err, info) {
//       results.push({
//         email: email,
//         success: info.success
//       });

//       // Send response when all emails are processed
//       if (index === emails.length - 1) {
//         res.json(results);
//       }
//     });
//   });
// };

// module.exports = { validateEmails };


const verifier = require('email-verify');

const validateEmails = async (req, res) => {
  const emails = req.body.emails;

  if (!Array.isArray(emails) || emails.length === 0) {
    return res.status(400).json({ message: 'Invalid input. Please provide an array of emails.' });
  }

  try {
    // Dynamically import p-limit
    const { default: pLimit } = await import('p-limit');
    const limit = pLimit(5);

    const results = await Promise.all(
      emails.map((email) =>
        limit(() =>
          new Promise((resolve) => {
            verifier.verify(email, function (err, info) {
              resolve({
                email: email,
                success: !err && info.success,
                info: err ? err.message : info,
              });
            });
          })
        )
      )
    );

    res.json(results);
  } catch (error) {
    res.status(500).json({ message: 'Error verifying emails.', error: error.message });
  }
};

module.exports = { validateEmails };

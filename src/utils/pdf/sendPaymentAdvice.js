require('dotenv').config();
const fs = require('fs');
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);
const send_email_report = async ({
  email,
  pathToAttachment,
  fileName,
  fileType,
  capitationMonth,
}) => {
  // const pathToAttachment = `${__dirname}/payment_advice.pdf`;
  const attachment = fs.readFileSync(pathToAttachment).toString('base64');
  const text = `Please find attached the payment advice for ${capitationMonth} capitation`;
  const payload = {
    to: email,
    from: process.env.SENDER_ADDRESS,
    subject: `Payment Advice, Capitation ${capitationMonth}`,
    text,
    attachments: [
      {
        content: attachment,
        filename: fileName,
        type: fileType,
        disposition: 'attachment',
      },
    ],
  };
  await sgMail.send(payload);
};
module.exports = send_email_report;

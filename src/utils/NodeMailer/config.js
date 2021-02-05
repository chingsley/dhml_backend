require('dotenv').config();
const { NODEMAILER_SENDER_PASSWORD, NODEMAILER_SENDER_ADDRESS } = process.env;

module.exports = {
  gmail: {
    // don't forget to allow less secure apps from the google console for the sender gmail
    service: 'gmail',
    auth: {
      user: NODEMAILER_SENDER_ADDRESS,
      pass: NODEMAILER_SENDER_PASSWORD,
    },
  },
  outlook: {
    host: 'smtp-mail.outlook.com',
    secureConnection: false,
    port: 587,
    tls: {
      ciphers: 'SSLv3',
    },
    auth: {
      user: NODEMAILER_SENDER_ADDRESS,
      pass: NODEMAILER_SENDER_PASSWORD,
    },
  },
};

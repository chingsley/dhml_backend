const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);
const { log } = console;

export default class Sendgrid {
  static async send({ email, message, html, subject }) {
    try {
      if (!message && !html) {
        throw new Error('mail sender was called without a message or html');
      }
      if (!email) {
        throw new Error('email must be provided');
      }
      const msg = {
        to: email,
        from: process.env.SENDER_ADDRESS,
        subject: subject,
        text: message || html,
        html: html || '',
      };

      const result = await sgMail.send(msg);
      !process.env.NODE_ENV?.match(/^production$|^test$/gi) &&
        log(result, message);
    } catch (error) {
      log('sendgrid email error: ', error);

      return error;
    }
  }
}

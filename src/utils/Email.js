const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);
const { log } = console;

export default class Email {
  static async send({ email, message, html }) {
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
        subject: 'Showtowa',
        text: message || html,
        html: html || '',
      };
      // console.log(
      //   'here................ 3',
      //   process.env.NODE_ENV,
      //   !process.env.NODE_ENV.match(/^production$|^test$/gi)
      // );
      const result = await sgMail.send(msg);
      !process.env.NODE_ENV?.match(/^production$|^test$/gi) &&
        log(result, message);
    } catch (error) {
      log('Error while sending email: ', error);

      return error;
    }
  }

  static getPasswordResetTemplate(resetToken) {
    const msg = `
  
  <!DOCTYPE html>
  <html>
    <head>
      <style>
        body {background-color: red; padding: 5px;}
        div {color: white; padding: 15px; padding-left: 10px; width: 80%; border-radius: 5px;}
        h1   {color: dark red;}
      </style>
    </head>
    <body>
      <div style="background-color: #130f40;">
          <p>click the link below to reset your password</p>
          <a href="${process.env.HOST_URL_FRONTEND}/password/reset/${resetToken}">${process.env.HOST_URL_FRONTEND}/password/reset/${resetToken}</a>
        <div />
    </body>
  </html>
  `;

    return msg;
  }
}

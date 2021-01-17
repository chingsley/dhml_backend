import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import { throwError } from '../../shared/helpers';
import smtpConfig from './config';

dotenv.config();

const { NODEMAILER_ACCT_TYPE, NODE_ENV } = process.env;
const config = smtpConfig[NODEMAILER_ACCT_TYPE];

const { log } = console;

export default class NodeMailer {
  static async sendMail(payload) {
    const notificationType = payload.notificationType || '';
    try {
      const { emails, subject, html } = payload;
      const mailOptions = {
        from: config.auth.user,
        to: emails,
        subject,
        html,
      };

      await nodemailer.createTransport(config).sendMail(mailOptions);
      return { message: 'mail successfully sent' };
    } catch (error) {
      NODE_ENV !== 'test' && log('email: ', error);
      throwError({
        status: 500,
        error: `Failed to send ${notificationType} notification to user(s); ${error.message}`,
      });
    }
  }
}

/* eslint-disable quotes */
const Printer = require('pdfmake');
const fs = require('fs');
import getLogoImgBasse64 from './getLogoImgBase64';
import getSignatureImgBase64 from './getSignatureImgBase64';

const pdfMake = require('pdfmake/build/pdfmake');
const moment = require('moment');
const pdfFonts = require('pdfmake/build/vfs_fonts');

export const downloadPaymentAdvice = (
  {
    capitationMonth,
    datePaid,
    hcpName,
    bankName,
    accountNumber,
    amount,
    armOfService,
  },
  documentName
) =>
  new Promise((resolve) => {
    pdfMake.vfs = pdfFonts.pdfMake.vfs;
    const formatteddate = moment(new Date(datePaid)).format('DD MMMM YYYY');
    const docDefinition = {
      pageSize: 'A3',
      content: [
        {
          image: getLogoImgBasse64(),
          width: 150,
          height: 150,
          alignment: 'center',
        },
        {
          text: 'DEFENCE HEALTH MAINTENANCE LTD.\n',
          style: 'header',
          fontSize: 35,
          bold: true,
          color: '#09B577',
          alignment: 'center',
        },
        {
          text:
            '\nHead Office: Plot 1323, Adesoji Aderemi Street, Gudu District, Abuja, Nigeria. 0704083787-8, 07098212850, 07037921025 ',
          style: 'subheader',
          fontSize: 14,
          bold: true,
          color: '#000000',
          alignment: 'center',
        },
        {
          text:
            'Website: www.dhmlnigeria.com e-Mail: info@dhmlnigeria.com \n\n',
          style: 'subheader',
          fontSize: 14,
          bold: true,
          color: '#000000',
          alignment: 'center',
        },
        {
          text: '\n\n Our Ref: DHML/ACC/1/20',
          style: 'subheader',
          fontSize: 14,
          color: '#000000',
          alignment: 'right',
        },
        {
          text: `\n ${formatteddate} \n`,
          style: 'subheader',
          fontSize: 14,
          bold: true,
          color: '#000000',
          alignment: 'right',
        },
        {
          text: `\n\n ${
            armOfService
              ? 'The Commanding Officer'
              : 'The Chief Medical Director'
          }`,
          style: 'subheader',
          fontSize: 14,
          color: '#000000',
          alignment: 'left',
        },
        {
          text: `\n ${hcpName} \n`,
          style: 'subheader',
          fontSize: 14,
          bold: true,
          color: '#000000',
          alignment: 'left',
        },
        {
          text: '\n\n  Dear Sir,',
          style: 'subheader',
          fontSize: 14,
          bold: true,
          color: '#000000',
          alignment: 'left',
        },
        {
          text: '\n  Attention: Accountant \n',
          style: 'subheader',
          fontSize: 14,
          bold: true,
          color: '#000000',
          alignment: 'left',
        },
        {
          text: '\n\n  PAYMENT ADVICE - CAPITATION',
          style: 'subheader',
          fontSize: 14,
          bold: true,
          color: '#000000',
          alignment: 'center',
          decoration: 'underline',
        },
        {
          text: `\nSequel to your forwarded bill for the months of ${capitationMonth} and subsequent vetting of same in line with the National Health Insurance Scheme’s Guidelines, I am directed to inform you that payment had been effected. Please find below the details:`,
          style: 'subheader',
          fontSize: 14,
          color: '#333333',
          alignment: 'justify',
        },
        {
          text: '\n\n',
          style: 'subheader',
          fontSize: 14,
          bold: true,
          color: '#000000',
          alignment: 'center',
        },
        {
          columns: [
            {
              text: 'Bank Name: ',
            },
            {
              text: bankName,
              bold: true,
            },
            {
              text: '',
            },
            {
              text: '',
            },
            {
              text: '',
            },
          ],
        },
        {
          columns: [
            {
              text: 'Account Number: ',
            },
            {
              text: accountNumber,
              bold: true,
            },
            {
              text: '',
            },
            {
              text: '',
            },
            {
              text: '',
            },
          ],
        },
        {
          columns: [
            {
              text: 'Amount: ',
            },
            {
              text: amount,
              bold: true,
            },
            {
              text: '',
            },
            {
              text: '',
            },
            {
              text: '',
            },
          ],
        },
        {
          text: '\n\n',
          style: 'subheader',
          fontSize: 14,
          color: '#000000',
          alignment: 'center',
        },

        {
          columns: [
            {
              text: 'Payment Date: ',
            },
            {
              text: formatteddate,
              bold: true,
            },
            {
              text: '',
            },
            {
              text: '',
            },
            {
              text: '',
            },
          ],
        },
        {
          columns: [
            {
              text: 'Mode of payment: ',
            },
            {
              text: 'Electronic Transfer',
              bold: true,
            },
            {
              text: '',
            },
            {
              text: '',
            },
            {
              text: '',
            },
          ],
        },
        {
          text:
            '\n\n While thanking you for the care rendered to our enrollees, we reassure you of our highest regards.',
          style: 'subheader',
          fontSize: 14,
          color: '#000000',
          alignment: 'left',
        },
        {
          text: "\n\n Your's Faithfully\n\n",
          style: 'subheader',
          fontSize: 14,
          bold: true,
          color: '#000000',
          alignment: 'left',
        },
        {
          image: getSignatureImgBase64(),
          width: 150,
          height: 60,
          alignment: 'left',
        },
        {
          text: '\n\nM.M. Sani',
          style: 'subheader',
          fontSize: 14,
          bold: true,
          color: '#000000',
          alignment: 'left',
        },

        {
          text: 'Head of Account',
          style: 'subheader',
          fontSize: 14,
          bold: true,
          color: '#000000',
          alignment: 'left',
        },
        {
          text: 'For Managing Director/CEO',
          style: 'subheader',
          fontSize: 14,
          bold: true,
          color: '#000000',
          alignment: 'left',
        },
      ],
    };

    const fileName = `.temp_doc/${documentName}`;
    const options = {};
    const fonts = {
      Roboto: {
        normal: 'fonts/Roboto-Regular.ttf',
        bold: 'fonts/Roboto-Medium.ttf',
        italics: 'fonts/Roboto-Italic.ttf',
        bolditalics: 'fonts/Roboto-Bold.ttf',
      },
    };
    const printer = new Printer(fonts);
    const pdfDoc = printer.createPdfKitDocument(docDefinition, options);
    pdfDoc.pipe(fs.createWriteStream(`${fileName}`));
    pdfDoc.end();
    pdfDoc.on('end', () => {
      resolve(`${fileName}`);
    });
  });

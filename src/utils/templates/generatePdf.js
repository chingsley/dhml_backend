const pdfMake = require('pdfmake/build/pdfmake');
const Printer = require('pdfmake');
const moment = require('moment');
const pdfFonts = require('pdfmake/build/vfs_fonts');
const fs = require('fs');
const check_date = (date) => {
  const dateInp = new Date(date).toString();
  if (dateInp === 'Invalid Date') {
    return false;
  }
  return true;
};

const formatPayload = (dataArr) => {
  let newArr = [];
  dataArr.forEach((row) => {
    const record = row.dataValues;
    const obj = {
      'SVC Number': record.serviceNumber || record.staffNumber || '',
      'ID Number': record.idNumber || '',
      Member: '',
      'Family Name': '',
      'Other Name': '',
      'Date Of Birth': '',
      Sex: '',
    };
    newArr.push(obj);
    const obj2 = {
      'SVC Number': '',
      'ID Number': '',
      Member: 'Principal',
      'Family Name': record['Family Name'] || '',
      'Other Name': record['Other Name'] || '',
      'Date Of Birth': check_date(record['Date Of Birth'])
        ? moment(record['Date Of Birth']).format('YYYY-MM-DD')
        : '',
      Sex: record['sex'] || '',
    };
    newArr.push(obj2);
    row.dependants.forEach(({ dataValues: ele }) => {
      const obj3 = {
        'SVC Number': '',
        'ID Number': '',
        Member: ele['Member'] || '',
        'Family Name': ele['Family Name'] || '',
        'Other Name': ele['Other Name'] || '',
        'Date Of Birth': check_date(ele['Date Of Birth'])
          ? moment(ele['Date Of Birth']).format('YYYY-MM-DD')
          : '',
        Sex: ele['Sex'] || '',
      };
      newArr.push(obj3);
    });
  });
  return newArr;
};

const generatePdf = (input, documentName) =>
  new Promise((resolve) => {
    const payload = formatPayload(input);
    const fonts = {
      Roboto: {
        normal: 'fonts/Roboto-Regular.ttf',
        bold: 'fonts/Roboto-Medium.ttf',
        italics: 'fonts/Roboto-Italic.ttf',
        bolditalics: 'fonts/Roboto-Bold.ttf',
      },
    };
    pdfMake.vfs = pdfFonts.pdfMake.vfs;
    const printer = new Printer(fonts);
    if (!payload.length) return;
    const mockBody = [];
    const headers = Object.keys(payload[0]).map((header) => ({
      text: header,
      style: 'tableHeader',
      fontSize: 14,
    }));
    mockBody.push(headers);
    payload.forEach((data) => {
      mockBody.push(
        Object.values(data).map((value) => ({
          text: value,
          fontSize: 14,
        }))
      );
    });
    const docDefinition = {
      pageSize: 'A1',
      content: [
        {
          text: 'DEFENCE HEALTH MAINTENANCE LTD.\n',
          style: 'header',
          fontSize: 35,
          bold: true,
          color: '#00C187',
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
          text: 'Website: www.dhmlnigeria.com e-Mail: info@dhmlnigeria.com \n',
          style: 'subheader',
          fontSize: 14,
          bold: true,
          color: '#000000',
          alignment: 'center',
        },
        {
          text: 'HCP/Enrollee Manifest. \n\n',
          style: 'subheader',
          fontSize: 24,
          bold: true,
          color: '#762D04',
          alignment: 'center',
        },
        {
          // layout: 'lightHorizontalLines',
          table: {
            headerRows: 1,
            alignment: 'center',
            widths: ['*', '*', '*', '*', '*', '*', '*'],
            body: mockBody,
          },
        },
      ],
    };
    const fileName = `.temp_doc/${documentName}`;
    const options = {};
    const pdfDoc = printer.createPdfKitDocument(docDefinition, options);
    pdfDoc.pipe(fs.createWriteStream(`${fileName}`));
    pdfDoc.end();
    pdfDoc.on('end', () => {
      resolve(`${fileName}`);
    });

    // pdfMake.createPdf(docDefinition).download(`${fileName || 'settlement'}${moment().format('DD-MM-YYYY hh:mm:ss')}`);
  });

module.exports = generatePdf;

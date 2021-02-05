const xl = require('excel4node');
const moment = require('moment');

const create_sheet = (
  ws,
  data,
  headerStyle,
  contentLength = 18,
  columnName
) => {
  const borderStyle = {
    style: 'thin',
    color: 'white',
  };
  const noBorder = {
    top: borderStyle,
    bottom: borderStyle,
    diagonal: borderStyle,
  };
  const alignment = {
    wrapText: true,
    horizontal: 'center',
    vertical: 'center',
  };
  const font = {
    bold: true,
    underline: false,
    color: '#00C187',
    name: 'Calibri',
  };
  ws.cell(1, 1, 5, contentLength, true)
    .string('DEFENCE HEALTH MAINTENANCE LTD.')
    .style({
      font: {
        ...font,
        color: '#00C187',
        size: 35,
      },
      alignment,
      border: {
        ...noBorder,
        top: {
          style: 'none',
        },
      },
    });
  ws.cell(6, 1, 6, contentLength, true)
    .string(
      'Head Office: Plot 1323, Adesoji Aderemi Street, Gudu District, Abuja, Nigeria. 0704083787-8, 07098212850, 07037921025 '
    )
    .style({
      font: {
        ...font,
        color: '#000000',
        size: 13,
      },
      alignment,
      border: noBorder,
    });
  ws.cell(7, 1, 7, contentLength, true)
    .string('Website: www.dhmlnigeria.com e-Mail: info@dhmlnigeria.com')
    .style({
      font: {
        ...font,
        color: '#000000',
        size: 13,
      },
      alignment,
      border: noBorder,
    });
  ws.cell(8, 1, 12, contentLength, true)
    .string('HCP/Enrollee Manifest')
    .style({
      font: {
        ...font,
        size: 24,
        color: '#762D04',
      },
      alignment,
      border: {
        ...noBorder,
        bottom: {
          style: 'none',
        },
      },
    });
  const headingColumnNames = columnName;
  let headingColumnIndex = 1;
  headingColumnNames.forEach((heading) => {
    ws.cell(13, headingColumnIndex++)
      .string(heading)
      .style(headerStyle);
  });
  let rowIndex = 14;
  //Write Data in Excel file
  data.forEach(({ dataValues: principal }) => {
    let columnOuterIndex = 1;
    Object.keys(principal).forEach((rec) => {
      if (['serviceNumber', 'idNumber'].includes(rec)) {
        ws.cell(rowIndex, columnOuterIndex++).string(
          rec === 'serviceNumber'
            ? principal[rec] || principal.staffNumber || ''
            : principal[rec] || ''
        );
      }
    });
    let rowInnerIndex = rowIndex + 1;
    const principalRecord = {
      Member: 'Principal',
      'Family Name': principal['Family Name'],
      'Other Name': principal['Other Name'],
      'Date Of Birth': principal['Date Of Birth'],
      sex: principal.sex,
    };
    const dependantsArr = (principal && principal.dependants) || [];
    let dependants = [{ dataValues: principalRecord }, ...dependantsArr];
    dependants.forEach(({ dataValues: record }) => {
      let columnIndex = 3;
      Object.keys(record).forEach((columnName) => {
        if (typeof record[columnName] === 'number') {
          ws.cell(rowInnerIndex, columnIndex++).number(record[columnName] || 0);
        } else if (columnName === 'Date Of Birth') {
          ws.cell(rowInnerIndex, columnIndex++).string(
            moment(record[columnName]).format('YYYY-MM-DD') || ''
          );
        } else {
          ws.cell(rowInnerIndex, columnIndex++).string(
            record[columnName] || ''
          );
        }
      });
      rowInnerIndex++;
    });
    rowIndex = rowIndex + 1 + dependants.length;
  });
  return ws;
};
const generate_csv = (data, documentName, columnName) =>
  new Promise((resolve) => {
    const fileName = `.temp_doc/${documentName}`;
    const wb = new xl.Workbook();
    const options = {
      sheetFormat: {
        defaultColWidth: 20,
      },
    };
    let ws = wb.addWorksheet('Manifest', options);
    // let ws_settlement = wb.addWorksheet('Settlement', options)
    const headerStyle = wb.createStyle({
      font: {
        color: '#000000',
        size: 14,
        bold: true,
      },
      numberFormat: '$#,##0.00; ($#,##0.00); -',
    });
    ws = create_sheet(ws, data, headerStyle, 7, columnName);
    // ws_settlement = create_sheet(ws_settlement, settlement, headerStyle)
    wb.write(fileName, () => resolve(fileName));
    // wb.writeToBuffer().then(function (buffer) {
    //   // Do something with buffer
    //   resolve(buffer);
    // });
  });
export default generate_csv;

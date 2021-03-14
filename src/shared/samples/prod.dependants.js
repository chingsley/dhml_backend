const excelToJson = require('convert-excel-to-json');
require('../../prototypes/object.extensions').extendObject();
import { isDate } from 'moment';
import { zeroPadding } from '../../utils/helpers';
const db = require('../../database/models');
const { Op } = require('sequelize');

const { log } = console;

export const getNewSeed = async () => {
  const { seed_dependants: seed } = excelToJson({
    sourceFile: 'dependants_of_principal_for_integration_final.xlsx',
    header: {
      rows: 1,
    },
    columnToKey: {
      // A: 'enrolleeIdNo',
      // B: 'serviceNumber',
      C: 'serviceNumber',
      D: 'relationshipToPrincipal',
      E: 'surname',
      F: 'firstName',
      G: 'dateOfBirth',
      H: 'gender',
      I: 'hcpCode',
    },
  });

  const seededPrincipals = await db.Enrollee.findAll({
    where: {
      principalId: { [Op.is]: null },
    },
  });
  const lastPrincpalIdNo = seededPrincipals.sort(
    (p1, p2) => Number(p2.enrolleeIdNo) - Number(p1.enrolleeIdNo)
  )[0].enrolleeIdNo;
  console.log('lastPrincpalIdNo = ', lastPrincpalIdNo);

  const principals = seed
    .filter((s) => s.relationshipToPrincipal.match(/principal/i))
    .map((p, i) =>
      ({
        ...p,
        hcpId: 1170,
        enrolleeIdNo: zeroPadding(Number(lastPrincpalIdNo) + i + 1),
        bloodGroup: 'O+',
        relationshipToPrincipal: null,
      }.removeFields(['hcpCode']))
    );
  console.log('principals = ', principals.length);
  // console.log('principals = ', principals.slice(0, 3));
  const dictPrincServNo = principals.reduce((acc, p) => {
    acc[p.serviceNumber.toUpperCase()] = p;
    return acc;
  }, {});

  const alreadyCreatedPrincps = await seededPrincipals.filter(
    (p) =>
      p.serviceNumber &&
      dictPrincServNo[p.serviceNumber.toUpperCase()] !== undefined
  );

  console.log(
    'alreadyCreatedPrincps = ',
    alreadyCreatedPrincps.length,
    ' => ',
    alreadyCreatedPrincps.map((p) => `'${p.serviceNumber}'`).join(', ')
  );
  const alreadyCreatedSvns = alreadyCreatedPrincps.map((p) =>
    p.serviceNumber.toUpperCase()
  );

  const newPrincipals = principals.filter(
    (p) => !alreadyCreatedSvns.includes(p.serviceNumber.toUpperCase())
  );
  console.log('alreadyCreatedSvns.length = ', alreadyCreatedSvns.length);
  console.log('newPrincipals.length = ', newPrincipals.length);

  const dependants = seed
    .filter((s) => !s.relationshipToPrincipal.match(/principal/i))
    .map((dep) => ({
      ...dep,
      principalServiceNumber: dictPrincServNo[
        dep.serviceNumber.toUpperCase()
      ]?.serviceNumber.toUpperCase(),
      principalSurname: dictPrincServNo[
        dep.serviceNumber.toUpperCase()
      ]?.surname.toUpperCase(),
    }));
  console.log('dependants = ', dependants.length);

  const depsWithoutPrincipals = dependants.filter(
    (d) => d.principalServiceNumber === undefined
  );
  console.log('depsWithoutPrincipals = ', depsWithoutPrincipals.length);

  const depsWithPrincipals = dependants.filter(
    (d) => d.principalServiceNumber !== undefined
  );
  console.log('depsWithPrincipals = ', depsWithPrincipals.length);

  const depsWithMatchingSurname = depsWithPrincipals.filter((d) =>
    d.surname.match(new RegExp(d.principalSurname, 'i'))
  );
  console.log('depsWithMatchingSurname = ', depsWithMatchingSurname.length);

  const depsWithoutMatchingSurname = depsWithPrincipals.filter(
    (d) => !d.surname.match(new RegExp(d.principalSurname, 'i'))
  );
  console.log(
    'depsWithoutMatchingSurname = ',
    depsWithoutMatchingSurname.length
  );

  const recordsWithInvalidDOB = seed.filter(
    (s) => !isDate(new Date(s.dateOfBirth))
  );
  console.log('recordsWithInvalidDOB = ', recordsWithInvalidDOB.length);

  // const SVNs = seed_dependants.map((d) => d.serviceNumber.toUpperCase());
  // const uniqueSVNs = SVNs.filter(
  //   (value, index, self) => self.indexOf(value) === index
  // );
  // console.log(uniqueSVNs.length);
  // const principals = await db.Enrollee.findAll({
  //   where: { serviceNumber: { [Op.in]: uniqueSVNs } },
  // });
  // console.log(principals.length);

  return { principals: newPrincipals };
};

// X10113

export const hcpHeaders = [
  'code',
  'name',
  'category',
  'state',
  'status',
  'address',
  'email',
  'phoneNumber',
  'alternativePhoneNumber',
  'bank',
  'bankAddress',
  'accountNumber',
  'accountType',
  'roleId',
  'createdAt',
  'updatedAt',
];

// export async function queryProductionHcps() {
//   const hcps = await db.HealthCareProvider.findAll();
//   const xl = require('excel4node');
//   const wb = new xl.Workbook();
//   const ws = wb.addWorksheet('hcps');

//   hcpHeaders.forEach((key, i) => {
//     ws.cell(1, i + 1).string(key);
//   });

//   hcps
//     .map(({ dataValues }) => dataValues)
//     .forEach((hcp, i) => {
//       hcpHeaders.map((header, j) => {
//         ws.cell(i + 2, j + 1).string(`${hcp[header]}`);
//       });
//     });

//   wb.write('hcps_in_prod.xls');

//   log('created file: hcps_in_prod.xls ...');
// }

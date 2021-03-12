const excelToJson = require('convert-excel-to-json');
import { isDate } from 'moment';
import { zeroPadding } from '../../utils/helpers';
import { principals } from './prod.enrollees';
const db = require('../../database/models');
const { Op } = require('sequelize');

export const getDeps = async () => {
  const { seed_dependants } = excelToJson({
    sourceFile: 'dEPENDENTS_OF_PRINCIPAL_FOR_iNTEGRATION_FINAL.xlsx',
    header: {
      rows: 1,
    },
    columnToKey: {
      // A: 'enrolleeIdNo',
      // B: 'serviceNumber',
      C: 'serviceNumber', // RLTN skipped
      D: 'relationshipToPrincipal',
      E: 'surname',
      F: 'firstName',
      G: 'dateOfBirth', // AGE skipped
      H: 'gender',
      I: 'hcpCode',
    },
  });

  const SVNs = seed_dependants.map((d) => d.serviceNumber.toUpperCase());
  const uniqueSVNs = SVNs.filter(
    (value, index, self) => self.indexOf(value) === index
  );
  console.log(uniqueSVNs.length);
  const principals = await db.Enrollee.findAll({
    where: { serviceNumber: { [Op.in]: uniqueSVNs } },
  });
  console.log(principals.length);

  return uniqueSVNs;
};

// X10113

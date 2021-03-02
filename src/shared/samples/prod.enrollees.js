const excelToJson = require('convert-excel-to-json');
import { isDate } from 'moment';
import { zeroPadding } from '../../utils/helpers';
const db = require('../../database/models');
const { Op } = require('sequelize');

export const {
  Principal: principals,
  Spouse,
  Child1,
  Child2,
  Child3,
  Child4,
} = excelToJson({
  sourceFile: 'enrollees_production.xlsx',
  header: {
    rows: 1,
  },
  columnToKey: {
    A: 'enrolleeIdNo',
    B: 'serviceNumber',
    C: 'rltn', // RLTN skipped
    D: 'surname',
    E: 'otherNames',
    F: 'dateOfBirth',
    G: '', // AGE skipped
    H: 'gender',
    I: 'hcpCode',
  },
});

export const getProductionPrincipals = async () => {
  const hcps = await db.HealthCareProvider.findAll();
  const dictHcpId = hcps.reduce((acc, hcp) => {
    acc[hcp.code.toUpperCase()] = hcp.id;
    return acc;
  }, {});

  return principals
    .filter((p) => {
      return (
        p.enrolleeIdNo !== undefined &&
        p.surname !== undefined &&
        p.otherNames !== undefined &&
        p.dateOfBirth !== undefined &&
        p.hcpCode !== undefined &&
        p.serviceNumber !== undefined &&
        !isNaN(Number(p.enrolleeIdNo)) &&
        isDate(p.dateOfBirth)
      );
    })
    .map((p) => {
      if (!p.gender) {
        p.gender = 'male';
      } else if (p.gender.toLowerCase() === 'm') {
        p.gender = 'male';
      } else if (p.gender.toLowerCase() === 'f') {
        p.gender = 'female';
      }
      p.hcpId = dictHcpId[p.hcpCode.toUpperCase()];
      p.bloodGroup = 'O+';
      p.enrolleeIdNo = zeroPadding(p.enrolleeIdNo);
      p.isVerified = true;
      [p.firstName, p.middleName] = p.otherNames.trim().split(' ');
      p.scheme = 'AFRSHIP';

      // remove hcpCode and otherNames from the object
      return Object.entries(p).reduce((acc, [key, value]) => {
        if (key !== 'hcpCode' && key !== 'otherNames' && key !== 'rltn') {
          acc[key] = value;
        }
        return acc;
      }, {});
    })
    .filter((p) => p.hcpId !== undefined);
};

export const getProductionDependants = async () => {
  const hcps = await db.HealthCareProvider.findAll();
  const dictHcpId = hcps.reduce((acc, hcp) => {
    acc[hcp.code.toUpperCase()] = hcp.id;
    return acc;
  }, {});

  const seededPrincipals = await db.Enrollee.findAll({
    where: { principalId: { [Op.is]: null } },
  });
  const dictPrincipalId = seededPrincipals.reduce((acc, p) => {
    acc[p.enrolleeIdNo] = p.id;
    return acc;
  }, {});
  const dictPrincipalSurname = seededPrincipals.reduce((acc, p) => {
    acc[p.enrolleeIdNo] = p.surname;
    return acc;
  }, {});

  const { dependants } = [...Spouse, ...Child1, ...Child2, ...Child3, ...Child4]
    .filter((d) => {
      return (
        d.enrolleeIdNo !== undefined &&
        d.surname !== undefined &&
        d.otherNames !== undefined &&
        d.dateOfBirth !== undefined &&
        d.hcpCode !== undefined &&
        !isNaN(Number(d.enrolleeIdNo)) &&
        isDate(d.dateOfBirth)
      );
    })
    .map((d) => {
      if (!d.gender) {
        d.gender = 'male';
      } else if (d.gender.toLowerCase() === 'm') {
        d.gender = 'male';
      } else if (d.gender.toLowerCase() === 'f') {
        d.gender = 'female';
      }
      d.hcpId = dictHcpId[d.hcpCode.toUpperCase()];
      d.bloodGroup = 'O+';
      d.isVerified = true;
      [d.firstName, d.middleName] = d.otherNames.trim().split(' ');
      d.enrolleeIdNo = zeroPadding(d.enrolleeIdNo);
      d.principalId = dictPrincipalId[d.enrolleeIdNo];
      d.principalSurname = dictPrincipalSurname[d.enrolleeIdNo];
      d.relationshipToPrincipal = defineRelationship(d.rltn);
      d.scheme = 'AFRSHIP';

      // remove hcpCode and otherNames from the object
      return Object.entries(d).reduce((acc, [key, value]) => {
        if (
          key !== 'hcpCode' &&
          key !== 'otherNames' &&
          key !== 'serviceNumber' &&
          key !== 'rltn'
        ) {
          acc[key] = value;
        }
        return acc;
      }, {});
    })
    .filter(
      (d) =>
        d.hcpId !== undefined &&
        d.principalId !== undefined &&
        d.surname.toLowerCase() === d.principalSurname.toLowerCase()
    )
    .reduce(
      (acc, d) => {
        if (acc.dict[d.enrolleeIdNo] === undefined) {
          acc.dict[d.enrolleeIdNo] = 1;
        } else {
          acc.dict[d.enrolleeIdNo] += 1;
        }
        d.enrolleeIdNo = `${d.enrolleeIdNo}-${acc.dict[d.enrolleeIdNo]}`;
        acc.dependants.push(d);
        return acc;
      },
      { dict: {}, dependants: [] }
    );
  return dependants
    .filter((d) => d.surname.toLowerCase() === d.principalSurname.toLowerCase())
    .map((d) => {
      return Object.entries(d).reduce((acc, [key, value]) => {
        if (key !== 'principalSurname') {
          acc[key] = value;
        }
        return acc;
      }, {});
    }, []);
};

function defineRelationship(rltn) {
  if (rltn.match(/spouse/i)) {
    return 'spouse';
  } else {
    return 'child';
  }
}

// async function getHcpId(hcpCode) {
//   const hcps = await db.HealthCareProvider.findAll();
//   const dictHcpId = hcps.reduce((acc, hcp) => {
//     acc[hcp.code.toUpperCase()] = hcp.id;
//     return acc;
//   }, {});
//   return dictHcpId[hcpCode.toUpperCase()];
// }

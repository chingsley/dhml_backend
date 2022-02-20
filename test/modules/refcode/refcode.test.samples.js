/* eslint-disable jest/expect-expect */
import getEnrollees from '../../../src/shared/samples/enrollee.samples';
import SampleReferalCodes from '../../../src/shared/samples/refcode.samples';
import TestService from '../app/app.test.service';
import _HcpService from '../hcp/hcp.test.service';
// const { log } = console;

export default class _RefcodeSamples {
  static async initialize() {
    const { primaryHcps, secondaryHcps } = await _HcpService.seedHcps({
      numPrimary: 1,
      numSecondary: 2,
    });
    const { principals, dependants } = getEnrollees({
      numOfPrincipals: 3,
      sameSchemeDepPerPrincipal: 1,
    });
    const seededAfrshipPrincipals = await TestService.seedAfrshipPrincipals(
      principals,
      primaryHcps[0]
    );
    const seededDependants = await TestService.seedDependants(
      dependants,
      seededAfrshipPrincipals,
      primaryHcps[0]
    );

    const payload = {
      data: {
        ...SampleReferalCodes.getTestPayloads(1)[0],
        enrolleeIdNo: seededAfrshipPrincipals[0].enrolleeIdNo,
        referringHcpId: primaryHcps[0].id,
        receivingHcpId: secondaryHcps[0].id,
      },
      remove(field) {
        return Object.entries(this.data).reduce((acc, entry) => {
          const [key, value] = entry;
          if (field !== key) {
            acc[key] = value;
          }
          return acc;
        }, {});
      },
      setValue([key, value]) {
        const prevData = this.data;
        return { ...prevData, [key]: value };
      },
      set(changes) {
        return {
          ...this.data,
          ...changes,
        };
      },
    };
    return {
      primaryHcps,
      secondaryHcps,
      seededAfrshipPrincipals,
      seededDependants,
      payload,
    };
  }
}

export function getClaimsReqPayload(refcode) {
  return {
    referalCode: refcode,
    claims: [
      {
        category: 'general services',
        serviceName: 'sking graft treatment',
        unit: 2,
        pricePerUnit: 1.5,
      },
      {
        category: 'internal medicine',
        serviceName: 'acute malaria treatment',
        unit: 3,
        pricePerUnit: 1.5,
      },
      {
        category: 'drug',
        drugDosageForm: 'some value',
        drugStrength: 'some value',
        drugPresentation: 'some value',
        unit: 10,
        drugName: 'Lonart DS',
        pricePerUnit: 9.5,
      },
    ],
  };
}

export const getTotalClaimsAmt = (claims) => {
  return claims.reduce(
    (acc, claim) => acc + claim.unit * claim.pricePerUnit,
    0
  );
};

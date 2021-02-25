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
        enrolleeId: seededAfrshipPrincipals[0].id,
        destinationHcpId: secondaryHcps[0].id,
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

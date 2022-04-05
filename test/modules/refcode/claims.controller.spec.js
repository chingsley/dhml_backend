/* eslint-disable jest/expect-expect */
import getSampleStaffs from '../../../src/shared/samples/staff.samples';
import TestService from '../app/app.test.service';
import ROLES from '../../../src/shared/constants/roles.constants';
import RefcodeApi from './refcode.test.api';
import Jwt from '../../../src/utils/Jwt';
import _HcpService from '../hcp/hcp.test.service';
import getEnrollees from '../../../src/shared/samples/enrollee.samples';
import _RefcodeService from './refcode.test.service';
import _SpecialityService from '../specialty/specialty.test.services';
import { _random } from '../../../src/utils/helpers';
import { CODE_STATUS } from '../../../src/shared/constants/lists.constants';
import { stateCodes } from '../../../src/shared/constants/statecodes.constants';
import { getClaimsReqPayload, getTotalClaimsAmt } from './refcode.test.samples';
import ClaimsApi from './claim.test.api';
require('../../../src/prototypes/array.extensions').extendArray();

const validStates = Object.keys(stateCodes);

describe('ClaimsController (Tested in the test Refcode Module', () => {
  describe('CreateNewClaims', () => {
    let token,
      seededEnrollees,
      referringHcps,
      receivingHcps,
      seededCodeRequests,
      operatorId,
      refcode;

    beforeAll(async () => {
      await TestService.resetDB();
      const { primaryHcps, secondaryHcps } = await _HcpService.seedHcps({
        numPrimary: 2,
        numSecondary: 3,
      });
      referringHcps = primaryHcps;
      receivingHcps = secondaryHcps;
      const { sampleStaffs } = getSampleStaffs(5);
      await TestService.seedStaffs(sampleStaffs);
      const { principals, dependants } = getEnrollees({
        numOfPrincipals: 5,
        sameSchemeDepPerPrincipal: 2,
        vcshipDepPerPrincipal: 2,
      });
      const preparedPrincipals = principals.map((p, i) => {
        if (p.scheme.toUpperCase() === 'DSSHIP') {
          p.staffNumber = sampleStaffs[i].staffIdNo;
        }
        return { ...p, hcpId: primaryHcps[0].id };
      });
      const seededPrincipals = await TestService.seedEnrollees(preparedPrincipals);
      const depsWithPrincipalId = dependants.map((d) => {
        for (let p of seededPrincipals) {
          const regexPrincipalEnrolleeIdNo = new RegExp(`${p.enrolleeIdNo}-`);
          if (d.enrolleeIdNo.match(regexPrincipalEnrolleeIdNo)) {
            return {
              ...d,
              principalId: p.id,
              hcpId: p.hcpId,
            };
          }
        }
      });
      const seededDeps = await TestService.seedEnrollees(depsWithPrincipalId);
      seededEnrollees = [...seededPrincipals, ...seededDeps];
      const sampleSpecialties = _SpecialityService.getSamples();
      const seededSpecialties = await _SpecialityService.seedBulk(
        sampleSpecialties.map((sp) => ({ ...sp, id: undefined }))
      );
      seededCodeRequests = await _RefcodeService.seedSampleCodeRequests({
        enrollees: seededEnrollees,
        specialties: seededSpecialties,
        referringHcps,
        receivingHcps,
      });
      const data = await TestService.getToken(sampleStaffs[0], ROLES.MD);
      token = data.token;
      const { userId } = Jwt.decode(token);
      operatorId = userId;
      refcode = seededCodeRequests[0];
      // refcodeId = seededCodeRequests[0].id;
    });
    it('it ensures a dhml user can create new claims', async (done) => {
      try {
        // reset all prev status updates on refcode due to preceeding tests
        await _RefcodeService.resetAllStatusUpdate(refcode.id);

        // approve code request to generate referal code
        const res1 = await RefcodeApi.updateRequestStatus(
          refcode.id,
          {
            status: CODE_STATUS.APPROVED,
            stateOfGeneration: _random(validStates),
          },
          token
        );

        // add claims to the refcode
        const claimsRequestPayload = getClaimsReqPayload(res1.body.data.code);
        const res = await RefcodeApi.addClaims(claimsRequestPayload, token);

        await refcode.reloadWithAssociations();

        expect(res.status).toEqual(201);
        expect(refcode.claims).toHaveLength(claimsRequestPayload.claims.length);
        expect(refcode.originalClaims).toHaveLength(claimsRequestPayload.claims.length);
        done();
      } catch (e) {
        done(e);
      }
    });
    it('it ensures a hcp user can create new claims', async (done) => {
      try {
        // reset all prev status updates on refcode due to preceeding tests
        await TestService.resetDB(['Claim', 'OriginalClaim']);
        await _RefcodeService.resetAllStatusUpdate(refcode.id);

        // approve code request to generate referal code
        const res1 = await RefcodeApi.updateRequestStatus(
          refcode.id,
          {
            status: CODE_STATUS.APPROVED,
            stateOfGeneration: _random(validStates),
          },
          token
        );

        // add claims to the refcode
        const claimsRequestPayload = getClaimsReqPayload(res1.body.data.code);
        await refcode.reloadWithAssociations();
        const { token: hcpToken } = await TestService.getHcpToken(refcode.receivingHcp);
        const res = await RefcodeApi.addClaims(claimsRequestPayload, hcpToken);

        await refcode.reloadWithAssociations();

        expect(res.status).toEqual(201);
        expect(refcode.claims).toHaveLength(claimsRequestPayload.claims.length);
        expect(refcode.originalClaims).toHaveLength(claimsRequestPayload.claims.length);
        done();
      } catch (e) {
        done(e);
      }
    });
    it('it ensures a hcp bulk-process claims', async (done) => {
      try {
        // reset all prev status updates on refcode due to preceeding tests
        await TestService.resetDB(['Claim', 'OriginalClaim']);
        await _RefcodeService.resetAllStatusUpdate(refcode.id);

        // approve code request to generate referal code
        const res1 = await RefcodeApi.updateRequestStatus(
          refcode.id,
          {
            status: CODE_STATUS.APPROVED,
            stateOfGeneration: _random(validStates),
          },
          token
        );

        // add claims to the refcode
        const claimsRequestPayload = getClaimsReqPayload(res1.body.data.code);
        await refcode.reloadWithAssociations();
        const { token: hcpToken } = await TestService.getHcpToken(refcode.receivingHcp);
        const res2 = await RefcodeApi.addClaims(claimsRequestPayload, hcpToken);

        const [id1, id2] = res2.body.data.map((c) => c.id);
        const payload = {
          remove: [id1],
          update: [
            {
              id: id2,
              category: 'radiology',
              serviceName: 'Massage (for test)',
              unit: 20,
              pricePerUnit: 10,
            },
          ],
          create: [
            { category: 'orthopaedics', serviceName: 'someLoven', unit: 2, pricePerUnit: 10 },
            {
              category: 'drug',
              drugName: 'Darftin (my special update param)',
              drugDosageForm: 'tablet',
              drugStrength: 'high',
              drugPresentation: 'semi solid',
              unit: 2,
              pricePerUnit: 10,
            },
          ],
          referalCode: refcode.code,
        };
        // const payload = { remove: claimIdsToRemove,  };
        const res3 = await ClaimsApi.processBulkClaims(payload, hcpToken);

        await refcode.reloadWithAssociations();

        expect(res3.status).toEqual(200);

        // test the length of claims is correct after bulk processging
        expect(refcode.claims).toHaveLength(
          claimsRequestPayload.claims.length - payload.remove.length + payload.create.length
        );
        expect(refcode.originalClaims).toHaveLength(
          claimsRequestPayload.claims.length - payload.remove.length + payload.create.length
        );

        // it deletes claims from both originalClaims and claims
        expect(refcode.claims.find((c) => c.id === payload.remove[0])).toBeUndefined();
        expect(refcode.originalClaims.find((c) => c.id === payload.remove[0])).toBeUndefined();

        // confirm that update happens correctly in both records
        expect(
          refcode.claims.find((c) => c.serviceName === payload.update[0].serviceName)
        ).toBeDefined();
        expect(
          refcode.originalClaims.find((c) => c.serviceName === payload.update[0].serviceName)
        ).toBeDefined();

        // confirm that new claims are added in both records
        expect(
          refcode.claims.find((c) => c.serviceName === payload.create[0].serviceName)
        ).toBeDefined();
        expect(
          refcode.originalClaims.find((c) => c.serviceName === payload.create[0].serviceName)
        ).toBeDefined();
        expect(
          refcode.claims.find((c) => c.drugName === payload.create[1].drugName)
        ).toBeDefined();
        expect(
          refcode.originalClaims.find((c) => c.drugName === payload.create[1].drugName)
        ).toBeDefined();

        done();
      } catch (e) {
        done(e);
      }
    });
    it('it ensures a dhml bulk-process claims', async (done) => {
      try {
        // reset all prev status updates on refcode due to preceeding tests
        await TestService.resetDB(['Claim', 'OriginalClaim']);
        await _RefcodeService.resetAllStatusUpdate(refcode.id);

        // approve code request to generate referal code
        const res1 = await RefcodeApi.updateRequestStatus(
          refcode.id,
          {
            status: CODE_STATUS.APPROVED,
            stateOfGeneration: _random(validStates),
          },
          token
        );

        // add claims to the refcode
        const claimsRequestPayload = getClaimsReqPayload(res1.body.data.code);
        await refcode.reloadWithAssociations();
        const { token: hcpToken } = await TestService.getHcpToken(refcode.receivingHcp);
        const res2 = await RefcodeApi.addClaims(claimsRequestPayload, hcpToken);

        const [id1, id2] = res2.body.data.map((c) => c.id);
        const payload = {
          remove: [id1],
          update: [
            {
              id: id2,
              category: 'radiology',
              serviceName: 'Massage (for test)',
              unit: 20,
              pricePerUnit: 10,
            },
          ],
          // create: [],
          create: [
            { category: 'orthopaedics', serviceName: 'someLoven', unit: 2, pricePerUnit: 10 },
            {
              category: 'drug',
              drugName: 'Darftin (my special update param)',
              drugDosageForm: 'tablet',
              drugStrength: 'high',
              drugPresentation: 'semi solid',
              unit: 2,
              pricePerUnit: 10,
            },
          ],
          referalCode: refcode.code,
        };
        // const payload = { remove: claimIdsToRemove,  };
        const res3 = await ClaimsApi.processBulkClaims(payload, token);

        await refcode.reloadWithAssociations();

        expect(res3.status).toEqual(200);

        // test the length of claims is correct after bulk processging
        expect(refcode.claims).toHaveLength(
          claimsRequestPayload.claims.length - payload.remove.length + payload.create.length
        );
        expect(refcode.originalClaims).toHaveLength(claimsRequestPayload.claims.length);

        // it deletes claims from claims but not from originalClaims
        expect(refcode.claims.find((c) => c.id === payload.remove[0])).toBeUndefined();
        expect(refcode.originalClaims.find((c) => c.id === payload.remove[0])).toBeDefined();

        // confirm that update happens correctly in Claims but not in OriginalClaims
        expect(
          refcode.claims.find((c) => c.serviceName === payload.update[0].serviceName)
        ).toBeDefined();
        expect(
          refcode.originalClaims.find((c) => c.serviceName === payload.update[0].serviceName)
        ).toBeUndefined();

        // confirm that new claims are added in Claims but not in OriginalClaims
        expect(
          refcode.claims.find((c) => c.serviceName === payload.create[0].serviceName)
        ).toBeDefined();
        expect(
          refcode.originalClaims.find((c) => c.serviceName === payload.create[0].serviceName)
        ).toBeUndefined();
        expect(
          refcode.claims.find((c) => c.drugName === payload.create[1].drugName)
        ).toBeDefined();
        expect(
          refcode.originalClaims.find((c) => c.drugName === payload.create[1].drugName)
        ).toBeUndefined();

        done();
      } catch (e) {
        done(e);
      }
    });
    it('it ensures a dhml gets claims summary containing summary of both vetted and original claims', async (done) => {
      try {
        // reset all prev status updates on refcode due to preceeding tests
        await TestService.resetDB(['Claim', 'OriginalClaim']);
        await _RefcodeService.resetAllStatusUpdate(refcode.id);

        // approve code request to generate referal code
        const res1 = await RefcodeApi.updateRequestStatus(
          refcode.id,
          {
            status: CODE_STATUS.APPROVED,
            stateOfGeneration: _random(validStates),
          },
          token
        );

        // add claims to the refcode
        const claimsRequestPayload = getClaimsReqPayload(res1.body.data.code);
        await refcode.reloadWithAssociations();
        const { token: hcpToken } = await TestService.getHcpToken(refcode.receivingHcp);
        const res2 = await RefcodeApi.addClaims(claimsRequestPayload, hcpToken);

        const [id1, id2] = res2.body.data.map((c) => c.id);
        const payload = {
          remove: [id1],
          update: [
            {
              id: id2,
              category: 'radiology',
              serviceName: 'Massage (for test)',
              unit: 20,
              pricePerUnit: 10,
            },
          ],
          // create: [],
          create: [
            { category: 'orthopaedics', serviceName: 'someLoven', unit: 2, pricePerUnit: 10 },
            {
              category: 'drug',
              drugName: 'Darftin (my special update param)',
              drugDosageForm: 'tablet',
              drugStrength: 'high',
              drugPresentation: 'semi solid',
              unit: 2,
              pricePerUnit: 10,
            },
          ],
          referalCode: refcode.code,
        };

        const originalTotalAmt = getTotalClaimsAmt(claimsRequestPayload.claims);
        const unchangedClaims = res2.body.data.filter((c) => ![id1, id2].includes(c.id));
        const unchangedAmount = getTotalClaimsAmt(unchangedClaims);
        const newAmount = getTotalClaimsAmt([...payload.update, ...payload.create]);
        const vettedAmount = newAmount + unchangedAmount;
        const vettedClaimsCount =
          claimsRequestPayload.claims.length - payload.remove.length + payload.create.length;

        // ORIGINAL AND VETTED CLAIMS ARE IDENTICAL BEFORE DHML UPDATES
        const res4 = await ClaimsApi.getClaims(token);
        const dhmlViewBefore = res4.body.data.rows[0];
        expect(+dhmlViewBefore.originalAmount).toEqual(originalTotalAmt);
        expect(+dhmlViewBefore.amount).toEqual(originalTotalAmt);
        expect(+dhmlViewBefore.originalNumOfClaims).toEqual(
          claimsRequestPayload.claims.length
        );
        expect(+dhmlViewBefore.numOfClaims).toEqual(claimsRequestPayload.claims.length);

        // -- DHML UPDATE HAPPENS --
        await ClaimsApi.processBulkClaims(payload, token);

        // -- AFTER UPDATE, DHML USER SEES DIFFEREINCE B/W ORIGNAL AND VETTED --
        const res5 = await ClaimsApi.getClaims(token);
        const dhmlViewAfter = res5.body.data.rows[0];
        expect(res5.status).toEqual(200);
        expect(+dhmlViewAfter.amount).toEqual(vettedAmount);
        expect(+dhmlViewAfter.originalAmount).toEqual(originalTotalAmt);
        expect(+dhmlViewAfter.originalNumOfClaims).toEqual(claimsRequestPayload.claims.length);
        expect(+dhmlViewAfter.numOfClaims).toEqual(vettedClaimsCount);
        expect(+dhmlViewAfter.originalNumOfClaims).toEqual(claimsRequestPayload.claims.length);

        // -- AFTER UPDATE HCP USER STILL SEES ONLY ORIGINAL STATS--
        const res6 = await ClaimsApi.getClaims(hcpToken);
        const hcpViewAfter = res6.body.data.rows[0];
        expect(res6.status).toEqual(200);
        expect(+hcpViewAfter.amount).toEqual(originalTotalAmt);
        expect(+hcpViewAfter.numOfClaims).toEqual(claimsRequestPayload.claims.length);

        done();
      } catch (e) {
        done(e);
      }
    });
    it('it ensures identical original and vetted claims on HCP UPDATES', async (done) => {
      try {
        // reset all prev status updates on refcode due to preceeding tests
        await TestService.resetDB(['Claim', 'OriginalClaim']);
        await _RefcodeService.resetAllStatusUpdate(refcode.id);

        // approve code request to generate referal code
        const res1 = await RefcodeApi.updateRequestStatus(
          refcode.id,
          {
            status: CODE_STATUS.APPROVED,
            stateOfGeneration: _random(validStates),
          },
          token
        );

        // add claims to the refcode
        const claimsRequestPayload = getClaimsReqPayload(res1.body.data.code);
        await refcode.reloadWithAssociations();
        const { token: hcpToken } = await TestService.getHcpToken(refcode.receivingHcp);
        const res2 = await RefcodeApi.addClaims(claimsRequestPayload, hcpToken);

        const [id1, id2] = res2.body.data.map((c) => c.id);
        const payload = {
          remove: [id1],
          update: [
            {
              id: id2,
              category: 'radiology',
              serviceName: 'Massage (for test)',
              unit: 20,
              pricePerUnit: 10,
            },
          ],
          // create: [],
          create: [
            { category: 'orthopaedics', serviceName: 'someLoven', unit: 2, pricePerUnit: 10 },
            {
              category: 'drug',
              drugName: 'Darftin (my special update param)',
              drugDosageForm: 'tablet',
              drugStrength: 'high',
              drugPresentation: 'semi solid',
              unit: 2,
              pricePerUnit: 10,
            },
          ],
          referalCode: refcode.code,
        };

        const originalTotalAmt = getTotalClaimsAmt(claimsRequestPayload.claims);
        const unchangedClaims = res2.body.data.filter((c) => ![id1, id2].includes(c.id));
        const unchangedAmount = getTotalClaimsAmt(unchangedClaims);
        const newAmount = getTotalClaimsAmt([...payload.update, ...payload.create]);
        const vettedAmount = newAmount + unchangedAmount;
        const vettedClaimsCount =
          claimsRequestPayload.claims.length - payload.remove.length + payload.create.length;

        // HCP VIEW BEFORE UPDATE: ORIGINAL AND VETTED CLAIMS ARE IDENTICAL
        const res4 = await ClaimsApi.getClaims(hcpToken);
        const hcpViewBefore = res4.body.data.rows[0];
        expect(+hcpViewBefore.amount).toEqual(originalTotalAmt);
        expect(+hcpViewBefore.numOfClaims).toEqual(claimsRequestPayload.claims.length);
        expect(hcpViewBefore.originalAmount).toBeUndefined();
        expect(hcpViewBefore.originalNumOfClaims).toBeUndefined();

        // DHML VIEW BEFORE UPDATE: ORIGINAL AND VETTED CLAIMS ARE IDENTICAL
        const res5 = await ClaimsApi.getClaims(token);
        const dhmlViewBefore = res5.body.data.rows[0];
        expect(+dhmlViewBefore.originalAmount).toEqual(originalTotalAmt);
        expect(+dhmlViewBefore.amount).toEqual(originalTotalAmt);
        expect(+dhmlViewBefore.numOfClaims).toEqual(claimsRequestPayload.claims.length);
        expect(+dhmlViewBefore.originalNumOfClaims).toEqual(
          claimsRequestPayload.claims.length
        );

        // ------------- HCP UPDATE HAPPENS --------------
        await ClaimsApi.processBulkClaims(payload, hcpToken);
        // -----------------------------------------------

        // -- DHML VIEW AFTER HCP UPDATE: ORIGINAL AND VETTED CLAIMS ARE IDENTICAL:
        const res6 = await ClaimsApi.getClaims(token);
        const dhmlViewAfter = res6.body.data.rows[0];
        expect(res5.status).toEqual(200);
        expect(+dhmlViewAfter.originalAmount).toEqual(vettedAmount);
        expect(+dhmlViewAfter.amount).toEqual(vettedAmount);
        expect(+dhmlViewAfter.originalNumOfClaims).toEqual(vettedClaimsCount);
        expect(+dhmlViewAfter.numOfClaims).toEqual(vettedClaimsCount);

        // -- HCP VIEW AFTER HCP UPDATE: ORIGINAL AND VETTED CLAIMS ARE IDENTICAL.
        // (originalAmount and originalNumOfClaims are returned as amount and numOfClaism)
        const res7 = await ClaimsApi.getClaims(hcpToken);
        const hcpViewAfter = res7.body.data.rows[0];
        expect(res6.status).toEqual(200);
        expect(+hcpViewAfter.amount).toEqual(vettedAmount);
        expect(+hcpViewAfter.numOfClaims).toEqual(vettedClaimsCount);
        expect(hcpViewAfter.originalAmount).toBeUndefined();
        expect(hcpViewAfter.originalNumOfClaims).toBeUndefined();

        done();
      } catch (e) {
        done(e);
      }
    });
  });
});

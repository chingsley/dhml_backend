import db from '../../../src/database/models';
import { states } from '../../../src/shared/constants/lists.constants';
import { _random } from '../../../src/utils/helpers';

const faker = require('faker');

import TestService from '../app/app.test.service';

class _RefcodeService extends TestService {
  static seedBulk(refcodes) {
    return db.ReferalCode.bulkCreate(refcodes);
  }
  static bulkUpdate(seededRefcodes, changes) {
    const ids = seededRefcodes.map((refcode) => refcode.id);
    return db.ReferalCode.update(changes, { where: { id: ids } });
  }

  static flag(seededRefcodes) {
    return this.bulkUpdate(seededRefcodes, { isFlagged: true });
  }

  static approve(seededRefcodes) {
    return this.bulkUpdate(seededRefcodes, { isFlagged: false });
  }

  static async reload(seededRefcode) {
    await seededRefcode.reload({
      include: [
        { model: db.Enrollee, as: 'enrollee' },
        { model: db.HealthCareProvider, as: 'destinationHcp' },
      ],
    });
    return seededRefcode;
  }

  static seedSampleCodeRequests({
    enrollees,
    specialties,
    referringHcps,
    receivingHcps,
  }) {
    return this.seedBulk(
      enrollees.map((enrollee) => ({
        enrolleeId: enrollee.id,
        specialtyId: _random(specialties).id,
        referringHcpId: _random(referringHcps).id,
        receivingHcpId: _random(receivingHcps).id,
        reasonForReferral: faker.lorem.text(),
        diagnosis: faker.lorem.words(),
        clinicalFindings: faker.lorem.text(),
        requestState: _random(states).toLowerCase(),
      }))
    );
  }

  static flagCodeRequests(seededCodeRequests, flaggedById) {
    return Promise.all(
      seededCodeRequests.slice(0, 3).map((scr) =>
        scr.update({
          dateFlagged: new Date(),
          flaggedById,
          flaggReason: faker.lorem.text(),
        })
      )
    );
  }

  static resetAllStatusUpdate(refcodeId) {
    const intialValues = {
      dateDeclined: null,
      declinedById: null,
      dateFlagged: null,
      flaggedById: null,
      dateApproved: null,
      approvedById: null,
      flagReason: null,
      declineReason: null,
      expiresAt: null,
      dateClaimed: null,
      code: null,
    };
    return db.ReferalCode.update(intialValues, { where: { id: refcodeId } });
  }

  static decoratePayload(payload) {
    return {
      data: payload,
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
  }
}

export default _RefcodeService;

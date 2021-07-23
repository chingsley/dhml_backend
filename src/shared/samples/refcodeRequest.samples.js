import { v4 as uuidv4 } from 'uuid';
import { stateCodes } from '../constants/statecodes.constants';
const faker = require('faker');
const {
  _random,
  getServiceStatusCode,
  randInt,
} = require('../../utils/helpers');
const { moment, days, months } = require('../../utils/timers');
const { states } = require('../constants/lists.constants');

class RefcodeSample {
  constructor({ enrollees, specialties, hcpSpecialties, users } = {}) {
    this.enrollees = enrollees;
    this.specialties = specialties;
    this.codePool = [];
    this.enrollees = enrollees;
    this.hcpSpecialties = hcpSpecialties;
    this.userIds = users.map((user) => user.id);
    this.staffIdNos = users.map((user) => user.staffInfo.staffIdNo);
  }

  getOne(enrollee = this.enrollees[0]) {
    const randomNum = randInt(0, this.hcpSpecialties.length - 1);
    return {
      id: uuidv4(),
      enrolleeId: enrollee.id,
      referringHcpId: enrollee.hcpId,
      receivingHcpId: this.hcpSpecialties[randomNum].hcpId,
      specialtyId: this.hcpSpecialties[randomNum].specialtyId,
      reasonForReferral: faker.lorem.text(),
      diagnosis: faker.lorem.words(),
      clinicalFindings: faker.lorem.text(),
      requestState: _random(states),
      requestedBy: _random(this.staffIdNos),
    };
  }

  getOneApproved({
    enrollee = _random(this.enrollees),
    approvedById = _random(this.userIds),
    dateApproved = days.setPast(randInt(1, 14)),
    stateOfGeneration = _random(Object.keys(stateCodes)),
  } = {}) {
    const request = this.getOne(enrollee);
    const specialtyCode = this.specialties.find(
      (_specialty) => _specialty.id === request.specialtyId
    ).code;
    const stateCode = stateCodes[stateOfGeneration.toLowerCase()];
    const code = this.getDummyCode({
      stateCode,
      specialtyCode,
      enrolleeServiceStatus: enrollee.serviceStatus,
      dateApproved,
    });
    return {
      ...request,
      code,
      dateApproved,
      approvedById,
      stateOfGeneration,
    };
  }

  getOneVerified({
    enrollee = _random(this.enrollees),
    dateVerified = months.setPast(randInt(0, 2)),
    claimsVerifierId = _random(this.userIds),
  }) {
    return {
      ...this.getOneApproved({ enrollee }),
      claimsVerifiedOn: dateVerified,
      claimsVerifierId,
    };
  }

  getDummyCode({
    stateCode,
    specialtyCode,
    enrolleeServiceStatus,
    dateApproved,
  }) {
    const date = moment(dateApproved).format('DDMMYY');
    const serviceStatus = getServiceStatusCode(enrolleeServiceStatus);

    const similarCodes = this.codePool.filter((_code) => {
      const _date = _code.match(/\d{6}/)[0];
      const _specialtyCode = _code.match(/\d+[A-Z]/)[0];
      return specialtyCode === _specialtyCode && date === _date;
    });

    const codeTypeCount = similarCodes.length + 1;
    const code = `${stateCode}/${date}/022/${specialtyCode}-${codeTypeCount}/${serviceStatus}`;
    this.codePool.push(code);
    return code;
  }

  getBulkSamples({ numPending = 0, numApproved = 0, numVerified = 0 } = {}) {
    if (numPending + numApproved + numVerified > this.enrollees.length) {
      throw new Error(
        `numPending(${numPending}) + numApproved(${numApproved}) cannot be greater than no. of enrollees(${this.enrollees.lenght})`
      );
    }
    const pendingRequests = [];
    const approvedRequests = [];
    const verifiedRequests = [];
    let count = 0;
    const endCount = numPending + numApproved + numVerified;
    // generate pending codes
    while (count < numPending) {
      pendingRequests.push(this.getOne(this.enrollees[count]));
      count++;
    }

    // generate approved codes
    while (count < numPending + numApproved) {
      approvedRequests.push(
        this.getOneApproved({ enrollee: this.enrollees[count] })
      );
      count++;
    }

    // generate verified codes
    while (count < endCount) {
      verifiedRequests.push(
        this.getOneVerified({ enrollee: this.enrollees[count] })
      );
      count++;
    }
    return [...pendingRequests, ...approvedRequests, ...verifiedRequests];
  }
}

// module.exports = generateSampleRequestForRefcodesForSeed;
module.exports = RefcodeSample;

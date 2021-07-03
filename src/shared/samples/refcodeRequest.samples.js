import { v4 as uuidv4 } from 'uuid';
import { stateCodes } from '../constants/statecodes.constants';
const faker = require('faker');
const {
  _random,
  getServiceStatusCode,
  randInt,
} = require('../../utils/helpers');
const { moment, days } = require('../../utils/timers');
const { states } = require('../constants/lists.constants');

{
  // const refcodePool = [];
  // const getDummyRefcode = ({
  //   stateCode,
  //   specialtyCode,
  //   enrolleeServiceStatus,
  // }) => {
  //   const date = moment().format('DDMMYY');
  //   const serviceStatus = getServiceStatusCode(enrolleeServiceStatus);
  //   const similarCodes = refcodePool.filter((_code) => {
  //     const _stateCode = _code.match(/[A-Z]+\//)[0].match(/[A-Z]+/)[0];
  //     const _date = _code.match(/\d{6}/)[0];
  //     const _specialtyCode = _code.match(/\d+[A-Z]/)[0];
  //     return (
  //       stateCode === _stateCode &&
  //       specialtyCode === _specialtyCode &&
  //       date === _date
  //     );
  //   });
  //   const codeTypeCount = similarCodes.length + 1;
  //   const code = `${stateCode}/${date}/022/${specialtyCode}-${codeTypeCount}/${serviceStatus}`;
  //   refcodePool.push(code);
  //   return code;
  // };
}

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

  getBulkSamples({ pending, approved } = {}) {
    if (pending + approved > this.enrollees.length) {
      throw new Error(
        `pending(${pending}) + approved(${approved}) cannot be greater than no. of enrollees(${this.enrollees.lenght})`
      );
    }
    const pendingRequests = [];
    const approvedRequests = [];
    let count = 0;
    const endCount = pending + approved;
    while (count < pending) {
      pendingRequests.push(this.getOne(this.enrollees[count]));
      count++;
    }
    while (count < endCount) {
      approvedRequests.push(this.getOneApproved(this.enrollees[count]));
      count++;
    }

    return [...pendingRequests, ...approvedRequests];
  }
}

// module.exports = generateSampleRequestForRefcodesForSeed;
module.exports = RefcodeSample;

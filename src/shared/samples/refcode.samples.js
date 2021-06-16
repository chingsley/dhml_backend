const faker = require('faker');
const { days, moment } = require('../../utils/timers');
const { MAX_USER_COUNT } = require('../constants/seeders.constants');
const db = require('../../database/models');
const {
  specialistCodes,
  stateCodes,
} = require('../constants/statecodes.constants');

class SampleReferalCodes {
  static chosenSpecialistCodes = [];

  static generateSampleRefcodeRequest({
    enrolleeIdNo,
    specialtyId,
    referringHcpId,
    receivingHcpId,
  }) {
    return {
      enrolleeIdNo,
      reasonForReferral: faker.lorem.text(),
      diagnosis: faker.lorem.words(),
      clinicalFindings: faker.lorem.text(),
      specialtyId,
      referringHcpId,
      receivingHcpId,
    };
  }

  // static async getSeed(usersCount = MAX_USER_COUNT) {
  //   const seededEnrollees = await db.Enrollee.findAll();
  //   const refcodes = seededEnrollees.map((enrollee, i) => {
  //     const codeMetaData = this.getMetaData();
  //     // const operatorId =
  //     //   faker.random.arrayElement(Array.from(Array(usersCount).keys())) + 1;
  //     return {
  //       enrolleeId: enrollee.id,
  //       receivingHcpId: this.getSecondaryHcpId(i),
  //       // operatorId,
  //       ...codeMetaData,
  //       ...this.generateSampleCode(enrollee, codeMetaData, i),
  //     };
  //   });

  //   return refcodes;
  // }

  /**
   * enrollees are seededEnrollees with valid integer IDs
   * secondaryHCPs are seeded secondary HCPs with valid integer IDs
   * operatorId userId of a seeded user, probably gotten
   * from decoded token or seeded user
   *
   */
  static getTestSeed({ enrollees = [], secondaryHcps = [], operatorId } = {}) {
    const refcodes = Array.from(Array(enrollees.length).keys()).map((_, i) => {
      const codeMetaData = this.getMetaData();
      const secHcpLength = secondaryHcps.length;
      return {
        enrolleeId: enrollees[i].id,
        receivingHcpId: secondaryHcps[i % secHcpLength].id,
        operatorId,
        ...codeMetaData,
        ...this.generateSampleCode(enrollees[i], codeMetaData, i),
      };
    });

    return refcodes;
  }

  static getTestPayloads(count = 1) {
    return Array.from(Array(count).keys()).map(() => ({
      ...this.getMetaData(),
    }));
  }

  static generateSampleCode(enrollee, codeMetaData, i) {
    const { stateOfGeneration, specialist } = codeMetaData;
    const stateCode = stateCodes[stateOfGeneration];
    const n = faker.random.arrayElement(Array.from(Array(120).keys()));
    const day = moment(days.setPast(n)).format('DDMMYY');
    const specialistCode = specialistCodes[specialist];
    const count =
      this.chosenSpecialistCodes.filter(
        (record) =>
          record.specialistCode === specialistCode && record.day === day
      ).length + 1;
    const { serviceStatus: svs } = enrollee;
    const serviceStatus = svs ? (svs === 'serving' ? 'S' : 'R') : 'AD';
    this.chosenSpecialistCodes.push({ specialistCode, day });
    const code = `${stateCode}/${day}/022/${specialistCode}-${count}/${serviceStatus}`;
    const proxyCode = `${day}-${i}`;
    return { code, proxyCode, specialistCode };
  }

  /**
   *
   * @param {integer} i the index from getSampleReferCode function
   * The secondary HCPs start at id 768, and the last hcp has id 1167 (check the db)
   */
  static getSecondaryHcpId(i) {
    let result = (768 + i) % 1168;
    if (result < 768) {
      return this.getSecondaryHcpId(i + 1);
    } else {
      return result;
    }
  }

  static getMetaData = () => ({
    reasonForReferral: faker.lorem.text(),
    diagnosis: faker.lorem.words(),
    diagnosisStatus: faker.random.arrayElement(['provisional', 'final']),
    clinicalFindings: faker.lorem.text(),
    specialist: faker.random.arrayElement(Object.keys(specialistCodes)),
    stateOfGeneration: faker.random.arrayElement(Object.keys(stateCodes)),
  });
}

module.exports = SampleReferalCodes;

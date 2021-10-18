/* eslint-disable indent */
import db from '../../database/models';
import { Op } from 'sequelize';
import { throwError } from '../../shared/helpers';
import Cloudinary from '../../utils/Cloudinary';
import { QueryTypes } from 'sequelize';
import { zeroPadding, getAvailableIds } from '../../utils/helpers';
import { getReservedPrincipalIDs } from '../../database/scripts/enrollee.scripts';
import AppService from '../app/app.service';
import { enrolleeSearchableFields } from '../../shared/attributes/enrollee.attributes';
import enrolleeValidators from './enrollee.validators';
import {
  AFRSHIP_PRINCIPAL,
  DSSHIP_PRINCIPAL,
} from '../../shared/constants/enrollee.constants';
import { USERTYPES } from '../../shared/constants/lists.constants';

const { log } = console;

export default class EnrolleeService extends AppService {
  constructor({ body, files, query, params, user: operator }) {
    super({ body, files, query, params, operator });
    this.body = body;
    this.files = files;
    this.query = query;
    this.params = params;
    this.operator = operator;
  }
  async registerNewEnrollee(enrolleeData) {
    const { enrolmentType } = enrolleeData;
    const enrollee = enrolmentType.match(/principal/i)
      ? await this.enrolPrincipal(enrolleeData)
      : await this.enrolDependant(enrolleeData);

    this.record(`Registered new Enrollee (ID NO: ${enrollee.enrolleeIdNo})`);
    return enrollee;
  }

  async enrolPrincipal(enrolleeData) {
    const files = this.files;
    await this.ensureValidStaffNumber(enrolleeData.staffNumber);
    await this.ensureValidHcpId(enrolleeData.hcpId);
    await this.validateUnique(['serviceNumber', 'staffNumber'], {
      model: db.Enrollee,
      reqBody: enrolleeData,
      resourceType: 'Principal',
    });

    if (enrolleeData.enrolmentType === 'special-principal') {
      const { enrolleeIdNo } = enrolleeData;
      await this.validateSpecialPrincipalId(enrolleeIdNo);
      enrolleeData.enrolleeIdNo = zeroPadding(enrolleeIdNo);
    } else {
      enrolleeData.enrolleeIdNo = await db.Enrollee.generateNewPrincipalIdNo();
    }
    const uploadedImages = files ? await Cloudinary.bulkUpload(files) : {};
    const enrollee = this.saveRecord({
      ...enrolleeData,
      ...uploadedImages,
    });
    return enrollee;
  }

  async saveRecord(enrolleeRecord) {
    const t = await db.sequelize.transaction();
    try {
      const enrollee = await db.Enrollee.create(enrolleeRecord, {
        transaction: t,
      });
      await this.validateEnrolleeKeyParams(enrollee);
      await t.commit();
      await enrollee.reloadDetails();
      return enrollee;
    } catch (error) {
      // console.log('here....8', error);
      await t.rollback();
      throw error;
    }
  }

  async validateEnrolleeKeyParams(enrollee) {
    if (enrollee.type === AFRSHIP_PRINCIPAL) {
      // console.log('********* 1');
      return await this.validateAfshipPrincipal(enrollee);
    } else if (enrollee.type === DSSHIP_PRINCIPAL) {
      // console.log('********* 2');
      return await this.validateDsshipPrincipal(enrollee);
    } else {
      // console.log('********* 3');
      return await this.validateDependant(enrollee);
    }
  }

  async enrolDependant(enrolleeData) {
    const dependantData = enrolleeData;
    const files = this.files;
    await this.ensureValidHcpId(dependantData.hcpId);
    const { principalId: principalEnrolleeIdNo } = dependantData;
    const enrollee = await this.getByEnrolleeIdNo(principalEnrolleeIdNo);
    this.rejectIf(!enrollee.isPrincipal, {
      withError: `The enrollee with ID no. ${principalEnrolleeIdNo} is not a principal. You cannot register a dependant under another dependant.`,
    });
    const principal = enrollee;
    dependantData.principalId = principal.id;
    this.validateDependantScheme(principal.scheme, dependantData.scheme);
    principal.checkDependantLimit(dependantData);
    principal.checkSpouseLimit(dependantData);
    dependantData.enrolleeIdNo = principal.generateNewDependantIdNo();
    const uploadedImages = files ? await Cloudinary.bulkUpload(files) : {};
    const data = await db.Enrollee.createDependant(
      {
        ...dependantData,
        hcpId: dependantData.hcpId || principal.hcpId,
        armOfService: principal.armOfService,
        ...uploadedImages,
      },
      principal
    );
    return data;
  }

  async handleBulkUpload() {
    let enrollees = this.body.enrollees;
    const t = await db.sequelize.transaction();
    let stop = false;
    let completed = true;
    let i = 0;

    const enrolleeIdNos = enrollees.map(({ enrolleeIdNo }) => enrolleeIdNo);
    let existingEnrollees = await db.Enrollee.findAll({
      where: { enrolleeIdNo: enrolleeIdNos },
      attributes: ['enrolleeIdNo', 'surname', 'firstName'],
    });
    const existingEnrolleeIdNos = existingEnrollees.map(
      ({ enrolleeIdNo }) => enrolleeIdNo
    );
    if (existingEnrollees.length > 0) {
      // remove enrollees with existing enrolleeIdNos
      enrollees = enrollees.filter(
        ({ enrolleeIdNo }) => !existingEnrolleeIdNos.includes(enrolleeIdNo)
      );
      // console.log({ enrollees });
      // return {
      //   error: 'duplicate enrolleeIdNos',
      //   existingEnrolleeIdNos,
      // };
    }
    const serviceNumbers = enrollees.map(({ serviceNumber }) => serviceNumber);
    existingEnrollees = await db.Enrollee.findAll({
      where: { serviceNumber: serviceNumbers },
      attributes: ['enrolleeIdNo', 'surname', 'firstName', 'serviceNumber'],
    });
    const existingServiceNos = existingEnrollees.map(
      ({ serviceNumber }) => serviceNumber
    );

    if (existingServiceNos.length > 0) {
      // remove enrollees with existing serviceNumbers
      enrollees = enrollees.filter(
        ({ serviceNumber }) => !existingServiceNos.includes(serviceNumber)
      );
      // return { error: 'duplicate serviceNumbers', existingServiceNos };
    }

    // const enrollees = await this.extractDuplicateSVNs(enrollees);
    const results = [];
    const errors = [];

    // after debugging in test, change
    //this to use bulkCreate instead of the while loop
    while (enrollees[i] && !stop) {
      // console.log('enrollees[i]', enrollees[i]);
      try {
        const result = await db.Enrollee.create(enrollees[i], {
          transaction: t,
        });
        results.push(result);
        i += 1;
      } catch (error) {
        log(enrollees[i], error);
        errors.push(enrollees[i]);
        stop = true;
        completed = false;
        await t.rollback();
      }
    }
    if (completed) {
      await t.commit();
      return { 'results.length': results.length };
    } else {
      return { errors };
    }
    // return { 'results.length': results.length };
  }

  async extractDuplicateSVNs(enrollees) {
    const enrolleesSVNs = enrollees.map((e) => e.serviceNumber);
    const existingEnrollees = await db.Enrollee.findAll({
      where: { serviceNumber: enrolleesSVNs },
    });
    const duplicates = existingEnrollees.map((e) => e.serviceNumber);
    const enrolleesWithoutDuplicateSVNs = enrollees.filter(
      (e) => !duplicates.includes(e.serviceNumber)
    );
    log({
      enrolleesWithoutDuplicateSVNs: enrolleesWithoutDuplicateSVNs.length,
      'duplicates.length': duplicates.length,
      duplicates: duplicates.map((d) => `'${d}'`).join(', '),
    });
    return enrolleesWithoutDuplicateSVNs;
  }

  async getAllEnrollees() {
    const { userType, id: hcpId } = this.operator;
    const { isVerified } = this.query;
    let orderBy;
    if (isVerified === 'true') {
      orderBy = [
        ['dateVerified', 'DESC'],
        ['id', 'ASC'],
      ];
    } else if (isVerified === 'false') {
      orderBy = [
        ['createdAt', 'DESC'],
        ['id', 'ASC'],
      ];
    } else {
      orderBy = [['id', 'ASC']];
    }

    return await db.Enrollee.findAndCountAll({
      where: {
        ...this.searchRecordsBy(enrolleeSearchableFields),
        ...this.exactMatch(['isVerified']),
        ...(userType.toLowerCase() === 'hcp' ? { hcpId } : {}),
      },
      ...this.paginate(),
      order: orderBy,
      include: [
        {
          model: db.HealthCareProvider,
          as: 'hcp',
        },
      ],
    });
  }

  async getById() {
    const enrollee = await this.findOneRecord({
      modelName: 'Enrollee',
      where: {
        id: this.params.enrolleeId,
      },
      errorIfNotFound: `no Enrollee found for id ${this.params.enrolleeId}`,
      include: [
        {
          model: db.HealthCareProvider,
          as: 'hcp',
        },
        {
          model: db.Enrollee,
          as: 'dependants',
          include: {
            model: db.HealthCareProvider,
            as: 'hcp',
          },
        },
      ],
    });
    this.rejectIf(
      this.operator.userType === USERTYPES.HCP &&
        enrollee.hcpId !== this.operator.id,
      {
        withError: 'Access Denied. AUTH004',
        errorCode: 'AUTH004',
        status: 401,
      }
    );
    return enrollee;
  }

  async updateEnrolleeData() {
    const fls = this.files;
    const { dependants, ...rest } = this.body;
    await this.validateUnique(['staffNumber', 'serviceNumber'], {
      model: db.Enrollee,
      reqBody: rest,
      resourceType: 'An Enrollee',
      resourceId: this.params.enrolleeId,
    });
    const enrollee = await this.findWithReqParams();

    let dependantIds = [];
    if (dependants?.length > 0) {
      dependantIds = dependants.map((d) => d.id);
      await this.updateDependants(dependants);
    }
    const uploadedImages = fls ? await Cloudinary.bulkUpload(fls) : {};
    await enrollee.update({ ...rest, ...uploadedImages });
    await enrollee.reload({
      include: {
        model: db.Enrollee,
        as: 'dependants',
        where: { id: { [Op.in]: dependantIds } },
        required: false,
      },
    });

    this.record(`Edited Enrollee info (ID NO:${enrollee.enrolleeIdNo})`);
    return enrollee;
  }

  async updateDependants(dependants) {
    const promiseArr = dependants.map(({ id, ...rest }) =>
      db.Enrollee.update({ ...rest }, { where: { id } })
    );
    await Promise.all(promiseArr);
  }

  async verifyEnrollee() {
    const enrollee = await this.findWithReqParams();
    await enrollee.update({ isVerified: true, dateVerified: new Date() });
    if (enrollee.principalId === null) {
      const dependantIds = enrollee.dependants.map((depndt) => depndt.id);
      await db.Enrollee.update(
        { isVerified: true, dateVerified: new Date() },
        { where: { id: { [Op.in]: dependantIds } } }
      );
    }
    db.GeneralMonthlyCapitation.updateRecords();
    this.record(`Verified Enrollee (ID NO:${enrollee.enrolleeIdNo})`);
    return enrollee;
  }

  async unverifyEnrollee() {
    const enrollee = await this.findWithReqParams();
    await enrollee.update({ isVerified: false, dateVerified: null });
    if (enrollee.principalId === null) {
      const dependantIds = enrollee.dependants.map((depndt) => depndt.id);
      await db.Enrollee.update(
        { isVerified: false, dateVerified: null },
        { where: { id: { [Op.in]: dependantIds } } }
      );
    }
    db.GeneralMonthlyCapitation.updateRecords();
    this.record(`Unverified Enrollee (ID NO:${enrollee.enrolleeIdNo})`);
    return enrollee;
  }

  async destroyEnrollee() {
    const enrollee = await this.findWithReqParams();
    await enrollee.destroy();
    this.record(`Deleted Enrollee (ID NO:${enrollee.enrolleeIdNo})`);
    return enrollee;
  }

  async findWithReqParams() {
    const { enrolleeId: id } = this.params;
    return await this.findOneRecord({
      modelName: 'Enrollee',
      where: { id },
      include: [
        { model: db.Enrollee, as: 'dependants' },
        { model: db.HealthCareProvider, as: 'hcp' },
      ],
      isRequired: true,
      errorIfNotFound: `Invalid Enrollee id. No record found for id.: ${id}`,
    });
  }

  async getByEnrolleeIdNo(enrolleeIdNo) {
    const enrollee = await this.findOneRecord({
      modelName: 'Enrollee',
      where: { enrolleeIdNo },
      errorIfNotFound: `Invalid Enrollee ID number. No record found for EnrolleeIdNo.: ${enrolleeIdNo}`,
      errorCode: 'E001',
      include: [
        { model: db.Enrollee, as: 'dependants' },
        {
          model: db.HealthCareProvider,
          as: 'hcp',
          attributes: ['code', 'name'],
        },
      ],
    });
    return enrollee;
  }

  async validateSpecialPrincipalId(enrolleeIdNo) {
    if (Number(enrolleeIdNo) < 1 || Number(enrolleeIdNo) > 230) {
      const errorMsg =
        'Invalid Special Enrolment ID, allowed values must be in the range 1 - 230';
      throwError({
        status: 400,
        error: [errorMsg],
      });
    }
    const { dialect, database } = db.sequelize.options;
    const specialPrincipalIds = await db.sequelize.query(
      getReservedPrincipalIDs(dialect, database),
      {
        type: QueryTypes.SELECT,
      }
    );
    // the Number(enrolleeIdNo) in next line is not necessary b/c the
    // query(check the script file) already casts the id to integer
    const usedIDs = specialPrincipalIds.map(({ enrolleeIdNo }) =>
      Number(enrolleeIdNo)
    );
    if (usedIDs.includes(Number(enrolleeIdNo))) {
      const pool = Array.from(Array(231).keys()).slice(1);
      const availableIds = getAvailableIds(pool, usedIDs);
      throwError({
        status: 400,
        error: [
          `The Enrolment ID: ${enrolleeIdNo} has been taken, please choose from the available list: ${availableIds.join(
            ','
          )}`,
        ],
      });
    }
  }

  validateDependantScheme(prinicpalScheme, dependantScheme) {
    const allowed =
      prinicpalScheme === dependantScheme || dependantScheme === 'VCSHIP';
    if (!allowed) {
      throwError({
        status: 400,
        error: [
          `A principal in ${prinicpalScheme} cannot have a dependant in ${dependantScheme}`,
        ],
      });
    }
    return allowed;
  }
}

Object.assign(EnrolleeService.prototype, enrolleeValidators);

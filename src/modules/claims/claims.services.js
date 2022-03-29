import { v4 as uuidv4 } from 'uuid';
import AppService from '../app/app.service';
import db from '../../database/models';
import claimsScripts from '../../database/scripts/claims.scripts';
import rolesConstants from '../../shared/constants/roles.constants';
import hcpClaimsProcessor from './claims.helpers/hcp';
import dhmlClaimsProcessor from './claims.helpers/dhml';

export default class ClaimsService extends AppService {
  constructor({ body, files, query, params, user: operator }) {
    super({ body, files, query, params });
    this.body = body;
    this.files = files;
    this.query = query;
    this.params = params;
    this.ReferalCodeModel = db.ReferalCode;
    this.operator = operator;
    this.refcode = null;

    if (operator.role.title === rolesConstants.HCP) {
      for (const method of Object.getOwnPropertyNames(this.hcp)) {
        ClaimsService.prototype[method] = this.hcp[method];
      }
    } else {
      for (const method of Object.getOwnPropertyNames(this.dhml)) {
        ClaimsService.prototype[method] = this.dhml[method];
      }
    }
  }

  async addNewClaimSvc() {
    const { claims, referalCode } = this.body;
    const refcode = await this.$getRefcode(referalCode);
    this.$handleRefcodeValidation(this.operator, refcode);

    this.record(`Submitted claims for referal code: ${referalCode}`);
    const { originalClaims, preparedClaims } = this.$processBulkAdditions(claims);
    await db.OriginalClaim.bulkCreate(originalClaims);
    return db.Claim.bulkCreate(preparedClaims);
    // return this.$handleBulkAddtions(claims);
  }

  async getClaimsSvc() {
    return this.$getClaims(claimsScripts);
  }

  async updateByIdParam() {
    return this.$updateByIdParam();
  }

  async deleteByIdParam() {
    return this.$deleteByIdParam();
  }

  async handleBulkClaimProcessing() {
    const {
      remove: arrOfClaimIds = [],
      update: arrOfUpdates = [],
      create: arrOfNewClaims = [],
      referalCode,
    } = this.body;

    const refcode = await this.$getRefcode(referalCode);
    this.$handleRefcodeValidation(this.operator, refcode);
    const t = await db.sequelize.transaction();
    try {
      await this.$handleBulkDelete(arrOfClaimIds, t);
      await this.$handleBulkUpdate(arrOfUpdates, t);
      await this.$handleBulkAddtions(arrOfNewClaims, t);
      this.record(`Edited claims associated with code ${referalCode}`);
      await t.commit();
      return true;
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  async $handleBulkAddtions(arrOfNewClaims, t) {
    const { originalClaims, preparedClaims } = this.$processBulkAdditions(arrOfNewClaims);
    const tnx = t ? { transaction: t } : {};
    return this.$saveBulkClaims({ originalClaims, preparedClaims }, tnx);
  }

  $processBulkAdditions(arrOfNewClaims) {
    const refcodeId = this.refcode.id;
    const preparedBy = this.operator.subjectId;
    const { preparedClaims, originalClaims } = arrOfNewClaims.reduce(
      (acc, claim) => {
        const id = uuidv4();
        const originalClaimId = id;
        acc.originalClaims.push({ ...claim, id, refcodeId, preparedBy });
        acc.preparedClaims.push({ ...claim, id, refcodeId, preparedBy, originalClaimId });
        // NOTE: I've made claim.id = claim.originalClaimId = originalClaim.id
        return acc;
      },
      { preparedClaims: [], originalClaims: [] }
    );
    return { originalClaims, preparedClaims };
  }

  async $getRefcode(referalCode) {
    const refcode = await this.findOneRecord({
      modelName: 'ReferalCode',
      where: { code: referalCode },
      errorIfNotFound: 'Invalid Referal Code, please check the code and try again. REFC002',
    });
    this.refcode = refcode;
    return this.refcode;
  }

  $handleRefcodeValidation(operator, refcode) {
    this.authorizeRefcodeRecevingHcp(operator, refcode);
    refcode.rejectIfCodeIsExpired();
    refcode.rejectIfCodeIsClaimed();
    refcode.rejectIfCodeIsDeclined();
    return true;
  }
}

Object.assign(ClaimsService.prototype, {
  hcp: hcpClaimsProcessor(db),
  dhml: dhmlClaimsProcessor(db),
});

import AppService from '../app/app.service';
import db from '../../database/models';
import claimsScripts from '../../database/scripts/claims.scripts';

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
  }

  async addNewClaimSvc() {
    const { claims, referalCode } = this.body;
    const refcode = await this.$getRefcode(referalCode);
    this.$handleRefcodeValidation(this.operator, refcode);

    const preparedClaims = claims.map((claim) => ({
      ...claim,
      refcodeId: refcode.id,
      preparedBy: this.operator.subjectId,
    }));
    return db.Claim.bulkCreate(preparedClaims);
  }

  async getClaimsSvc() {
    const { operator } = this;
    const script = claimsScripts.getClaims;
    const nonPaginatedRows = await this.executeQuery(script, {
      ...this.query,
      pageSize: undefined,
      page: undefined,
      operator,
    });
    const count = nonPaginatedRows.length;
    const rows = await this.executeQuery(script, {
      ...this.query,
      operator,
    });
    const total = nonPaginatedRows.reduce((acc, record) => {
      acc += Number(record.amount);
      return acc;
    }, 0);
    return { count, rows, total };
  }

  async updateByIdParam() {
    const { claimId } = this.params;
    const claim = await this.$getClaimById(claimId);
    const refcode = claim.referalCode;
    this.$handleRefcodeValidation(this.operator, refcode);
    const changes = this.body;
    await claim.update(changes);
    return claim;
  }

  async deleteByIdParam() {
    const { claimId } = this.params;
    const claim = await this.$getClaimById(claimId);
    const refcode = claim.referalCode;
    this.$handleRefcodeValidation(this.operator, refcode);

    await claim.destroy();
    return claim;
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
    this.refcode = refcode;

    const t = await db.sequelize.transaction();
    try {
      await this.$handleBulkDelete(arrOfClaimIds, t);
      await this.$hanldBulkUpdate(arrOfUpdates, t);
      await this.$handleBulkAddtions(arrOfNewClaims, t);
      await t.commit();
      return true;
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  async $handleBulkDelete(arrOfClaimIds, t) {
    const claims = await this.$checkClaimIdsAssociationToRefcode(
      arrOfClaimIds,
      this.refcode
    );
    if (claims.length > 0) {
      await db.Claim.destroy({ where: { id: arrOfClaimIds }, transaction: t });
    }
    return true;
  }
  async $hanldBulkUpdate(arrOfUpdates, t) {
    const arrOfClaimIds = arrOfUpdates.map((claim) => claim.id);
    const claims = await this.$checkClaimIdsAssociationToRefcode(
      arrOfClaimIds,
      this.refcode
    );
    for (const claim of claims) {
      const changes = arrOfUpdates.find((clm) => clm.id === claim.id);
      delete changes.id;
      await claim.update(changes, { transaction: t });
    }
    return true;
  }
  async $handleBulkAddtions(arrOfNewClaims, t) {
    const preparedClaims = arrOfNewClaims.map((claim) => ({
      ...claim,
      refcodeId: this.refcode.id,
      preparedBy: this.operator.subjectId,
    }));
    await db.Claim.bulkCreate(preparedClaims, { transaction: t });
    return true;
  }

  async $checkClaimIdsAssociationToRefcode(arrOfClaimIds, refcode) {
    const claims = await db.Claim.findAll({
      where: { id: arrOfClaimIds },
      include: { model: db.ReferalCode, as: 'referalCode' },
    });
    for (const claim of claims) {
      this.rejectIf(claim.refcodeId !== refcode.id, {
        withError: `Error: ${claim.id} is not associated to the code: ${this.refcode.code}`,
      });
    }
    return claims;
  }

  $getRefcode(referalCode) {
    return this.findOneRecord({
      modelName: 'ReferalCode',
      where: { code: referalCode },
      errorIfNotFound:
        'Invalid Referal Code, please check the code and try again. REFC002',
    });
  }

  $handleRefcodeValidation(operator, refcode) {
    this.authorizeRefcodeRecevingHcp(operator, refcode);
    refcode.rejectIfCodeIsExpired();
    refcode.rejectIfCodeIsClaimed();
    refcode.rejectIfCodeIsDeclined();
    return true;
  }

  $getClaimById(claimId) {
    return this.findOneRecord({
      modelName: 'Claim',
      where: { id: claimId },
      include: { model: db.ReferalCode, as: 'referalCode' },
      errorIfNotFound: `No claim matches the id of ${claimId}`,
    });
  }
}

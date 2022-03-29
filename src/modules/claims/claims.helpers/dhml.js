// import claimsScripts from '../../database/scripts/claims.scripts';

const dhmlClaimsProcessor = (db) => ({
  async $getClaims(claimsScripts) {
    console.log('\n\n DHML \n\n');
    const { operator } = this;
    const script = claimsScripts.getClaimsSummary;
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
  },

  async $updateByIdParam() {
    const { claimId } = this.params;
    const claim = await this.$getClaimById(claimId);
    const refcode = claim.referalCode;
    this.$handleRefcodeValidation(this.operator, refcode);
    const changes = this.body;
    this.record(`Edited a claim (claimId: ${claimId}`);
    await claim.update(changes);
    return claim;
  },

  async $deleteByIdParam() {
    const { claimId } = this.params;
    const claim = await this.$getClaimById(claimId);
    const refcode = claim.referalCode;
    this.$handleRefcodeValidation(this.operator, refcode);
    this.record(`Deleted a claim (claimId: ${claim.id}`);
    await claim.destroy();
    return claim;
  },

  async $handleBulkDelete(arrOfClaimIds, t) {
    const claims = await this.$checkClaimIdsAssociationToRefcode(arrOfClaimIds, this.refcode);
    if (claims.length > 0) {
      await db.Claim.destroy({ where: { id: arrOfClaimIds }, transaction: t });
      this.record(`Deleted claims (claimIds: ${claims.map((c) => c.id)}`);
    }
    return true;
  },

  async $handleBulkUpdate(arrOfUpdates, t) {
    const arrOfClaimIds = arrOfUpdates.map((claim) => claim.id);
    const claims = await this.$checkClaimIdsAssociationToRefcode(arrOfClaimIds, this.refcode);
    for (const claim of claims) {
      const changes = arrOfUpdates.find((clm) => clm.id === claim.id);
      delete changes.id;
      await claim.update(changes, { transaction: t });
      this.record(`Edited a claim (claimId: ${claim.id}`);
    }
    return true;
  },

  async $saveBulkClaims({ preparedClaims }, trnx) {
    return db.Claim.bulkCreate(preparedClaims, trnx);
  },

  async $checkClaimIdsAssociationToRefcode(arrOfClaimIds, refcode) {
    const claims = await db.Claim.findAll({
      where: { id: arrOfClaimIds },
      include: [{ model: db.ReferalCode, as: 'referalCode' }],
    });
    for (const claim of claims) {
      this.rejectIf(claim.refcodeId !== refcode.id, {
        withError: `Error: ${claim.id} is not associated to the code: ${this.refcode.code}`,
      });
    }
    return claims;
  },

  $getClaimById(claimId) {
    return this.findOneRecord({
      modelName: 'Claim',
      where: { id: claimId },
      include: [{ model: db.ReferalCode, as: 'referalCode' }],
      errorIfNotFound: `No claim matches the id of ${claimId}`,
    });
  },
});

export default dhmlClaimsProcessor;

// import claimsScripts from '../../database/scripts/claims.scripts';

const hcpClaimsProcessor = (db) => ({
  async $getClaims(claimsScripts) {
    const { operator } = this;
    const script = claimsScripts.getOriginalClaimsSummary;
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
    const originalClaim = await this.$getClaimById(claimId);
    const refcode = originalClaim.referalCode;
    this.$handleRefcodeValidation(this.operator, refcode);
    const changes = this.body;
    this.record(`Edited a originalClaim (claimId: ${claimId}`);
    await originalClaim.claim?.update(changes);
    await originalClaim.update(changes);
    return originalClaim;
  },

  async $deleteByIdParam() {
    const { claimId } = this.params;
    const originalClaim = await this.$getClaimById(claimId);
    const refcode = originalClaim.referalCode;
    this.$handleRefcodeValidation(this.operator, refcode);
    this.record(`Deleted a originalClaim (claimId: ${originalClaim.id}`);
    await originalClaim.claim?.destroy();
    await originalClaim.destroy();
    return originalClaim;
  },

  async $handleBulkDelete(arrOfClaimIds, t) {
    const originalClaims = await this.$checkClaimIdsAssociationToRefcode(
      arrOfClaimIds,
      this.refcode
    );
    if (originalClaims.length > 0) {
      await db.Claim.destroy({ where: { originalClaimId: arrOfClaimIds }, transaction: t });
      await db.OriginalClaim.destroy({ where: { id: arrOfClaimIds }, transaction: t });
    }
    return true;
  },

  async $handleBulkUpdate(arrOfUpdates, t) {
    const arrOfClaimIds = arrOfUpdates.map((claim) => claim.id);
    const originalClaims = await this.$checkClaimIdsAssociationToRefcode(
      arrOfClaimIds,
      this.refcode
    );
    for (const originalClaim of originalClaims) {
      const changes = arrOfUpdates.find((clm) => clm.id === originalClaim.id);
      delete changes.id;
      await originalClaim.claim?.update(changes, { transaction: t });
      await originalClaim.update(changes, { transaction: t });
    }
    return true;
  },

  async $saveBulkClaims({ originalClaims, preparedClaims }, trnx) {
    await db.OriginalClaim.bulkCreate(originalClaims, trnx);
    return db.Claim.bulkCreate(preparedClaims, trnx);
  },

  async $checkClaimIdsAssociationToRefcode(arrOfClaimIds, refcode) {
    const originalClaims = await db.OriginalClaim.findAll({
      where: { id: arrOfClaimIds },
      include: [
        { model: db.Claim, as: 'claim' },
        { model: db.ReferalCode, as: 'referalCode' },
      ],
    });
    for (const claim of originalClaims) {
      this.rejectIf(claim.refcodeId !== refcode.id, {
        withError: `Error: ${claim.id} is not associated to the code: ${this.refcode.code}`,
      });
    }
    return originalClaims;
  },

  $getClaimById(claimId) {
    return this.findOneRecord({
      modelName: 'OriginalClaim',
      where: { id: claimId },
      include: [
        { model: db.Claim, as: 'claim' },
        { model: db.ReferalCode, as: 'referalCode' },
      ],
      errorIfNotFound: `No claim matches the id of ${claimId}`,
    });
  },
});

export default hcpClaimsProcessor;

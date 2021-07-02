import AppService from '../app/app.service';
import db from '../../database/models';

export default class ClaimsService extends AppService {
  constructor({ body, files, query, params, user: operator }) {
    super({ body, files, query, params });
    this.body = body;
    this.files = files;
    this.query = query;
    this.params = params;
    this.ReferalCodeModel = db.ReferalCode;
    this.operator = operator;
  }

  async addNewClaimSvc() {
    const { claims, referalCode } = this.body;
    const refcode = await this.$getRefcode(referalCode);
    this.$validateHcpRefcodeOwnership(this.operator, refcode);

    const preparedClaims = claims.map((claim) => {
      /**
       * there are some considerations to be made
       * when computing amount, ask Chi to remind you
       */
      const { unit, pricePerUnit } = claim;
      return {
        ...claim,
        amount: unit * pricePerUnit,
        refcodeId: refcode.id,
        preparedBy: this.operator.subjectId,
      };
    });
    return db.Claim.bulkCreate(preparedClaims);
  }

  async updateByIdParam() {
    const { claimId } = this.params;
    const claim = await this.$getClaimById(claimId);
    const refcode = claim.referalCode;
    refcode.rejectIfCodeIsExpired();
    refcode.rejectIfCodeIsClaimed();
    refcode.rejectIfCodeIsDeclined();
    this.$validateHcpRefcodeOwnership(this.operator, refcode);

    const changes = this.body;

    const { unit, pricePerUnit } = changes;
    if (unit || pricePerUnit) {
      changes.amount = unit * pricePerUnit;
    }
    await claim.update(changes);
    return claim;
  }

  $getRefcode(referalCode) {
    return this.findOneRecord({
      modelName: 'ReferalCode',
      where: { code: referalCode },
      errorIfNotFound:
        'Invalid Referal Code, please check the code and try again. REFC002',
    });
  }

  /**
   * Ensures the hcp making the claim is the receivingHcp
   * associated with the referal code specified req.body
   *
   * will skip the validation if operator is not a 'hcp' user...
   *  ...because state officers can prepare claims onbehalf of hcp's
   *
   * @param {string} refcode Referal code
   * @param {integer} hcpId hcp id
   */
  $validateHcpRefcodeOwnership(operator, refcode) {
    if (operator.userType === 'hcp') {
      const hcpId = operator.id;
      this.rejectIf(refcode.receivingHcpId !== hcpId, {
        withError:
          'Invalid Referal Code, please check the code and try again. REFC003',
        status: 401,
      });
    }

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

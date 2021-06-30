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
    const { unit, pricePerUnit, referalCode } = this.body;
    const refcode = await this.$getRefcode(referalCode);
    if (this.operator.userType === 'hcp') {
      const hcpId = this.operator.id;
      this.$validateRefcodeOwnership(refcode, hcpId);
    }
    /**
     * there are some considerations to be made
     * when computing amount, ask Chi to remind you
     */
    this.body.amount = unit * pricePerUnit;
    this.body.refcodeId = refcode.id;
    return db.Claim.create(this.body);
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
   * @param {string} refcode Referal code
   * @param {integer} hcpId hcp id
   */
  $validateRefcodeOwnership(refcode, hcpId) {
    this.rejectIf(refcode.receivingHcpId !== hcpId, {
      withError:
        'Invalid Referal Code, please check the code and try again. REFC003',
      status: 401,
    });
    return true;
  }
}

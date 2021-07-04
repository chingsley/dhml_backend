// const { v4 as uuidv4 } = require('sequelize/types');
import { v4 as uuidv4 } from 'uuid';
const { randInt, _random } = require('../../utils/helpers');
const services = require('./services.samples');

const drugs = require('../../../drugs.json').map((drug) => ({
  name: drug['NAME OF DRUG'].toLowerCase(),
  dosageForm: drug['DOSAGE FORM'],
  strength: drug['STRENGTHS'],
  presentation: drug['PRESENTATION'],
  pricePerUnit: drug['PRICE (N)'],
}));

class Claims {
  constructor(refcodes, verifierIds) {
    this.refcodes = refcodes;
    this.verifierIds = verifierIds;
  }

  getDrugClaim({ refcode = _random(this.refcodes) } = {}) {
    const drug = _random(drugs);
    return {
      id: uuidv4(),
      refcodeId: refcode.id,
      category: 'drug',
      drugName: drug.name,
      drugDosageForm: drug.dosageForm,
      drugStrength: drug.strength,
      drugPresentation: drug.presentation,
      unit: randInt(1, 10),
      pricePerUnit: Number(drug.pricePerUnit.replace(/,/g, '')),
      preparedBy: refcode.receivingHcp.code,
      verifierId: refcode.approvedById,
    };
  }

  getServiceClaim({ refcode = _random(this.refcodes) } = {}) {
    const service = _random(services);

    return {
      id: uuidv4(),
      refcodeId: refcode.id,
      category: service.category,
      serviceName: service.serviceName,
      unit: randInt(1, 10),
      pricePerUnit: service.pricePerUnit,
      preparedBy: refcode.receivingHcp.code,
      verifierId: refcode.approvedById,
    };
  }

  getClaim({ refcodeId, category } = {}) {
    return category === 'drug'
      ? this.getDrugClaim({ refcodeId })
      : this.getServiceClaim({ refcodeId, category });
  }

  getBulk({ numDrugClaims, numServiceClaims }) {
    if (numDrugClaims + numServiceClaims > this.refcodes.length) {
      throw new Error(
        `numDrugClaims(${numDrugClaims}) + numServiceClaims(${numServiceClaims}) cannot be greater than no. of refcodeIds(${this.refcodeIds.length})`
      );
    }
    let count = 0;
    const endCount = numDrugClaims + numServiceClaims;
    const drugClaims = [];
    const serviceClaims = [];

    while (count < numDrugClaims) {
      drugClaims.push(this.getDrugClaim());
      count++;
    }
    while (count < endCount) {
      serviceClaims.push(this.getServiceClaim());
      count++;
    }
    return [...drugClaims, ...serviceClaims];
  }
}

module.exports = Claims;

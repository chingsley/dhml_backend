const armyClass1 = /^\d\dNA\/\d\d\/\d{5}$/;
const armyClass2 = /^N\/\d{4,5}$/;
const navyClass1 = /^[A-Z]{1,2}\d{4,5}$/;
const navyClass2 = /^NN\/\d{4}$/;
const airforceClass1 = /^NAF\d\d\/\d{5}$/;
const airForceClass2 = /^NAF\/\d{4,5}$/;

const army = {
  PTE: armyClass1,
  LCPL: armyClass1,
  CPL: armyClass1,
  SGT: armyClass1,
  SSGT: armyClass1,
  WO: armyClass1,
  MWO: armyClass1,
  AWO: armyClass1,
  '2LT': armyClass2,
  LT: armyClass2,
  MAJ: armyClass2,
  'LT COL': armyClass2,
  COL: armyClass2,
  'BRIG GEN': armyClass2,
  'MAJ GEN': armyClass2,
  'LT GEN': armyClass2,
  GEN: armyClass2,
  'FD MSHL': armyClass2,
};

const navy = {
  OS: navyClass1,
  SM: navyClass1,
  AB: navyClass1,
  LS: navyClass1,
  PO: navyClass1,
  WO: navyClass1,
  MWO: navyClass1,
  NWO: navyClass1,
  MID: navyClass2,
  SLT: navyClass2,
  LT: navyClass2,
  'LT CDR': navyClass2,
  CDR: navyClass2,
  CAPT: navyClass2,
  CDRE: navyClass2,
  RADM: navyClass2,
  VADM: navyClass2,
  ADM: navyClass2,
};

const airForce = {
  ACM: airforceClass1,
  ACW: airforceClass1,
  LCPL: airforceClass1,
  CPL: airforceClass1,
  SGT: airforceClass1,
  FS: airforceClass1,
  WO: airforceClass1,
  MWO: airforceClass1,
  AWO: airforceClass1,
  'PLT OFFR': airForceClass2,
  'FG OFFR': airForceClass2,
  'FLT LT': airForceClass2,
  'SQN LDR': airForceClass2,
  'WG CDR': airForceClass2,
  'GP CAPT': airForceClass2,
  'AIR CDRE': airForceClass2,
  AVM: airForceClass2,
  'AIR MSHL': airForceClass2,
  'AIR CHF MSHL': airForceClass2,
};

export const serviceNumRegex = {
  ARMY: army,
  NAVY: navy,
  AIRFORCE: airForce,
};

// the 'reduce' method conversts all the states
// to lower case before export
export const stateCodes = {
  'abuja federal capital territory': 'FCT',
  'fct - abuja': 'FCT',
  abia: 'AB',
  adamawa: 'AD',
  'akwa ibom': 'AK',
  anambra: 'AN',
  bauchi: 'BA',
  bayelsa: 'BY',
  benue: 'BN',
  borno: 'BO',
  'cross river': 'CR',
  delta: 'DT',
  ebonyi: 'EB',
  edo: 'ED',
  ekiti: 'EK',
  enugu: 'EN',
  gombe: 'GB',
  imo: 'IM',
  jigawa: 'JG',
  kaduna: 'KD',
  kano: 'KN',
  katsina: 'KT',
  kebbi: 'KB',
  kogi: 'KG',
  kwara: 'KW',
  lagos: 'LA',
  nasarawa: 'NS',
  niger: 'NG',
  ogun: 'OG',
  ondo: 'OD',
  osun: 'OS',
  oyo: 'OY',
  plateau: 'PL',
  rivers: 'RV',
  sokoto: 'SK',
  taraba: 'TB',
  yobe: 'YB',
  zamfara: 'ZF',
};

// RANGE OF SPECIALISTS
export const specialistCodes = Object.entries({
  'GENERAL SURGEON': '1A',
  'ORTHOPAEDIC & TRAUMATOLOGIST': '1B',
  'OTORHINOLARINGOLOGIST (ENT)': '1C',
  OPHTHALMOLOGIST: '1D',
  'DENTAL SURGEON': '2A',
  'MAXILLO-FACIAL SURGEON': '2B',
  OBSTETRICIANS: '3A',
  GYNAECOLOGISTS: '3B',
  PHYSICIAN: '4A',
  PSYCHIATRIST: '4B',
  PAEDIATRICIAN: '5A',
  'CHEMICAL PATHOLOGIST': '6A',
  MICROBIOLOGIST: '6B',
  HISTOPATHOLOGIST: '6C',
  HAEMATOLOGIST: '6D',
  RADIOLOGIST: '7A',
  PHYSIOTHERAPIST: '8A',
  PHARMACIST: '9A',
  NURSES: '10A',
  RADIOGRAPHER: '11A',
  'MEDICAL LABORATORY SCIENTIST': '12A',
}).reduce((acc, [key, value]) => {
  acc[key.toLowerCase()] = value;
  return acc;
}, {});

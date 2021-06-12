import { v4 as uuidv4 } from 'uuid';

export const specialties = [
  'General Surgery',
  'Orthopaedics',
  'Internal Medicine',
  'Family Medicine',
  'Obstetrics and Gynaecoloty',
  'ENT Surgery',
  'Ophthalmology',
  'Radiology',
  'Maxilo-Facila Surgery',
  'Orthodontics',
].map((specialty) => ({ name: specialty, id: uuidv4() }));

const excelToJson = require('convert-excel-to-json');
import { isDate } from 'moment';
import Password from '../../utils/Password';

export const erregenStaff = {
  staffFileNo: 'info.erregen',
  staffIdNo: 'info.erregen',
  surname: 'info.erregen',
  firstName: 'info.erregen',
  middleName: 'info.erregen',
  gender: 'NOT SPECIFIED',
  permanentHomeAddress: 'NOT SPECIFIED',
  contactAddress: 'NOT SPECIFIED',
  dateOfBirth: '2020-07-01',
  placeOfBirth: 'NOT SPECIFIED',
  homeTown: 'NOT SPECIFIED',
  lga: 'NOT SPECIFIED',
  stateOfOrigin: 'NOT SPECIFIED',
  maritalStatus: 'single',
  numberOfChildren: 4,
  phoneNumber: '08039495558',
  firstAppointment: 'NOT SPECIFIED',
  dateOfFirstAppointment: '2020-10-05',
  gradeLevelOnFirstAppointment: '4',
  presentAppointment: 'NOT SPECIFIED',
  dateOfPresentAppointment: '2020-11-05',
  presentGradeLevel: '12',
  designation: 'NOT SPECIFIED',
  departmentOrUnit: 'NOT SPECIFIED',
  deployment: 'NOT SPECIFIED',
  location: 'NOT SPECIFIED',
  jobSchedule: 'NOT SPECIFIED',
  dateOfConfirmation: '2021-01-23',
  salaryPerAnnum: 'NOT_SPECIFIED',
  bank: 'NOT_SPECIFIED',
  branch: 'NOT_SPECIFIED',
  pfa: 'NOT_SPECIFIED',
  dateOfJoiningDhmlCooperativeSociety: '2020-03-30',
  primarySchoolAttended: 'NOT_SPECIFIED',
  secondarySchoolAttended: 'NOT_SPECIFIED',
  tertiaryIntitutionAttended: 'NOT_SPECIFIED',
  qualifications: 'NOT_SPECIFIED',
  nameOfPreviousEmployer: 'NOT_SPECIFIED',
  positionHeld: 'NOT_SPECIFIED',
  jobScheduleAtPreviousEmployment: 'NOT_SPECIFIED',
  reasonForDisengagement: 'NOT_SPECIFIED',
  dateOfDisengagement: '2020-05-14',
  hodRemarks: 'NOT_SPECIFIED',
  mdComment: 'NOT_SPECIFIED',
  nextOfKin: 'NOT_SPECIFIED',
  relationshipWithNok: 'NOT_SPECIFIED',
  addressOfNok: 'NOT_SPECIFIED',
  phoneNumberOfNok: 'NOT_SPECIFIED',
  accountNumber: 'NOT_SPECIFIED',
  email: 'info.erregen@gmail.com',
};

export const erregenUser = {
  email: 'info.erregen@gmail.com',
  roleId: 1,
  username: 'info.erregen',
  staffId: 1,
};

export const erregenPassword = {
  value: Password.hash('Testing*123'),
  userId: 1,
  isDefaultValue: false,
};

export const getStaffListProd = () => {
  const { Sheet1 } = excelToJson({
    sourceFile: 'STAFF_LIST_PROD.xls',
    header: {
      rows: 1,
    },
    columnToKey: {
      // A: 'id',
      B: 'surname',
      C: 'firstName',
      D: 'middleName',
      E: 'gender',
      F: 'phoneNumber',
      G: 'dateOfBirth',
      H: 'staffIdNo',
      I: 'designation',
      J: 'location',
      K: 'dateOfFirstAppointment',
    },
  });
  return Sheet1.map((staff) => {
    if (staff.gender === 'M') {
      staff.gender = 'male';
    } else if (staff.gender === 'F') {
      staff.gender = 'female';
    }
    if (staff.dateOfFirstAppointment && !isDate(staff.dateOfFirstAppointment)) {
      staff.dateOfFirstAppointment = null;
    }
    if (staff.dateOfBirth && !isDate(staff.dateOfBirth)) {
      staff.dateOfBirth = null;
    }
    return staff;
  }).filter((staff) => !!staff.staffIdNo && staff.staffIdNo !== 'DHML/P/126');
};

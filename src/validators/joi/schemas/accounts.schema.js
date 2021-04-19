import { Joi } from '../config';

export const getVoucherSchema = () => {
  return Joi.object({
    gmcId: Joi.number().integer().min(1).required(),
    department: Joi.string().trim(),
    acCode: Joi.string().trim(),
    pvNo: Joi.string().trim(),
    payee: Joi.string().trim(),
    serviceDate: Joi.date().format('YYYY-MM-DD'),
    serviceDescription: Joi.string().trim(),
    preparedBy: Joi.string().trim(),
    preparerDesignation: Joi.string().trim(),
    datePrepared: Joi.date().format('YYYY-MM-DD'),
    authorizedBy: Joi.string().trim(),
    authorizerDesignation: Joi.string().trim(),
    dateAuthorized: Joi.date().format('YYYY-MM-DD'),
  });
};

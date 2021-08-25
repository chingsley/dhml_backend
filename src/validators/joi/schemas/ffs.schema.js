import { Joi } from '../config';

export const getFFSVoucherSchema = () => {
  return Joi.object({
    department: Joi.string().trim(),
    acCode: Joi.string().trim(),
    pvNo: Joi.string().trim(),
    payee: Joi.string().trim(),
    address: Joi.string().trim(),
    amountInWords: Joi.string().trim().required(),
    serviceDate: Joi.date().format('YYYY-MM-DD'),
    serviceDescription: Joi.string().trim(),
    preparedBy: Joi.string().trim(),
    preparerDesignation: Joi.string().trim(),
    datePrepared: Joi.date().format('YYYY-MM-DD'),
    authorizedBy: Joi.string().trim(),
    authorizerDesignation: Joi.string().trim(),
    dateAuthorized: Joi.date().format('YYYY-MM-DD'),
    selectedHcpIds: Joi.array()
      .items(Joi.number().integer().min(1))
      .min(1)
      .unique()
      .required(),
  });
};

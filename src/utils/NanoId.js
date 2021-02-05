const { customAlphabet } = require('nanoid');
const { Op } = require('sequelize');

export default class NanoId {
  static async getValue({
    length,
    model,
    fields,
    pool,
    checkDuplicates = false,
  }) {
    const poolString = pool || '1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const nanoid = customAlphabet(poolString, length);
    if (checkDuplicates && !(model && fields?.length)) {
      throw new Error(
        'incorrect use of NanoId.getValue(), please specify checkDuplicates:false or specify model and array fields parameters'
      );
    }
    if (!checkDuplicates) {
      return nanoid();
    }

    let id;
    let idExists = true;
    do {
      id = nanoid();
      idExists = await model.findOne({
        where: {
          [Op.or]: [
            ...fields.reduce((arr, field) => {
              arr.push({ [field]: id });
              return arr;
            }, []),
          ],
        },
      });
    } while (idExists);

    return id;
  }
}

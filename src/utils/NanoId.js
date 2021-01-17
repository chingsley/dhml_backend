const { customAlphabet } = require('nanoid');

export default class NanoId {
  static async getValue({
    length,
    model,
    field,
    pool,
    checkDuplicates = false,
  }) {
    const poolString = pool || '1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const nanoid = customAlphabet(poolString, length);
    if (checkDuplicates && !(model && field)) {
      throw new Error(
        'incorrect use of NanoId.getValue(), please specify checkDuplicates:false or specify model and field parameters'
      );
    }

    let id;
    if (checkDuplicates) {
      let idExists = true;
      do {
        id = nanoid();
        idExists = await model.findOne({ where: { [field]: id } });
      } while (idExists);
    } else {
      id = nanoid();
    }

    return id;
  }
}

// export default { getNanoId };

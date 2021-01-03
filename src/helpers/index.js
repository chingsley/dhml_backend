export const validateSchema = async (schema, req) => {
  try {
    await schema.validateAsync({
      ...req.body,
      ...req.params,
      ...req.query,
    });
  } catch (error) {
    if (error.details?.[0].type?.match(/string.pattern.base/i)) {
      return errorDict[error.details[0].context.key];
    } else {
      return error.message;
    }
  }
};

const errorDict = {
  username:
    'invalid username. Username can only consist of lowercase letters, numbers, a dash and/or an underscore',
  password:
    'password must be a minimum of 8 characters long, must contain a lowercase, an uppercase, a number and a special character',
};

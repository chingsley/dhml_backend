export const throwError = (errorObject) => {
  throw new Error(JSON.stringify(errorObject));
};

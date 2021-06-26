export const throwError = (errorObject) => {
  throw new Error(JSON.stringify(errorObject));
};

export function rejectIf(condition, { withError, status = 400 }) {
  if (condition) {
    throwError({
      status: status,
      error: [withError],
    });
  }
}

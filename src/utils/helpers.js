export const setMinutes = (x) => new Date(Date.now() + Number(x) * 60 * 1000);
export default {
  setMinutes(x) {
    return new Date(Date.now() + Number(x) * 60 * 1000);
  },
};

exports.extendObject = function () {
  Object.prototype.removeFields = function (fieldList) {
    return Object.entries(this).reduce((acc, entry) => {
      const [key, value] = entry;
      if (!fieldList.includes(key)) {
        acc[key] = value;
      }
      return acc;
    }, {});
  };
};

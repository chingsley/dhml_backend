exports.extendArray = function () {
  Array.prototype.repreatElement = function (count) {
    return Array.from(Array(count).keys()).map(() => this[0]);
  };
};

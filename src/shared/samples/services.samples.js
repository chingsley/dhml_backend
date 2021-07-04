const excelToJson = require('convert-excel-to-json');

export function getServiceList() {
  const { Sheet1: data } = excelToJson({
    sourceFile: 'nhis_service_list.xlsx',
    header: {
      rows: 2, // no. of rows to skip (skip the headers)
    },
    columnToKey: {
      A: 'code',
      B: 'serviceName',
      C: 'pricePerUnit',
    },
    // columnToKey2: hcpHeaders.reduc,
  });
  return data;
}
const servicesAndCategories = getServiceList();
// console.log(services);

/**
 * after converting the excel to json, the categories
 * are represented as objects without the 'pricePerUnit' property
 * b/c in the excel, the column for price (column C) is empty for
 * categories
 * @param {object} service
 * @returns
 */
const removeCategories = (service) => !!service.pricePerUnit;

const onlyCategories = (service) => !service.pricePerUnit;
const categories = servicesAndCategories.filter(onlyCategories);
const services = servicesAndCategories.filter(removeCategories);
const servicesWithCategories = services.map((service) => {
  const serviceFirst8Code = service.code.slice(0, 8);
  const serviceCategory =
    categories.find((_cat) => {
      const categoryFirst8Code = _cat.code.slice(0, 8);
      return serviceFirst8Code === categoryFirst8Code;
    }) || {};
  return { ...service, category: serviceCategory.serviceName?.toLowerCase() };
});

module.exports = servicesWithCategories;

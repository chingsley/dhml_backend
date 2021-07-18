import { Op } from 'sequelize';

const ffsHelpers = {
  groupFFSByHcpState(rows) {
    return rows.reduce((acc, record) => {
      if (!acc[record.hcp.state]) {
        acc[record.hcp.state] = [record];
      } else {
        acc[record.hcp.state].push(record);
      }
      return acc;
    }, {});
  },
  canFilterBySelectedRecords({ selectedForPayment = null }) {
    const filter = { where: {} };
    if (selectedForPayment !== null) {
      const value = JSON.parse(String(selectedForPayment).toLowerCase());
      if (value === true) {
        filter.where = { auditRequestDate: { [Op.not]: null } };
      } else {
        filter.where = { auditRequestDate: { [Op.is]: null } };
      }
    }
    return filter;
  },
};

export default ffsHelpers;

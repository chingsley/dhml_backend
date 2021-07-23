/* eslint-disable indent */
import { ANALYSIS_DISPLAY_OPTIONS } from '../../../shared/constants/lists.constants';
import { moment } from '../../../utils/timers';

const reportsFormatter = {
  summarized(data, reqQuery) {
    const { display } = reqQuery;
    const { quarterly, biannual } = ANALYSIS_DISPLAY_OPTIONS;
    switch (display) {
      case quarterly:
        return this.displayQuarterly(data);
      case biannual:
        return this.displayBiannual(data);
      default:
        return this.displayAnnual(data);
    }
  },

  displayAnnual(data) {
    const monthlyRecords = this.groupByMonth(data);
    const total = this.computeTotals(data, monthlyRecords);
    return {
      rows: monthlyRecords,
      ...total,
    };
  },

  displayQuarterly(data) {
    const quarterlyRecords = this.groupByQuarter(data);
    const total = this.computeTotals(data, quarterlyRecords);
    return {
      rows: quarterlyRecords,
      ...total,
    };
  },

  displayBiannual(data) {
    const biannualRecords = this.groupBiannually(data);
    const total = this.computeTotals(data, biannualRecords);
    return {
      rows: biannualRecords,
      ...total,
    };
  },

  groupByMonth(data) {
    const intial = moment.months().reduce((acc, month) => {
      acc[month.toUpperCase()] = [];
      return acc;
    }, {});
    const groupedByMonth = data.reduce((acc, row) => {
      const monthInWords = moment(row.month).format('MMMM').toUpperCase();
      if (!acc[monthInWords]) {
        acc[monthInWords] = [row];
      } else {
        acc[monthInWords].push(row);
      }
      return acc;
    }, intial);

    const monthlyRecords = [];
    for (let [month, records] of Object.entries(groupedByMonth)) {
      const armOfServiceNumbers = records.reduce(
        (acc, record) => {
          if (!acc[record.armOfService]) {
            acc[record.armOfService] = Number(record.amount);
          } else {
            acc[record.armOfService] += Number(record.amount);
          }
          acc.total += Number(record.amount);
          return acc;
        },
        { total: 0 }
      );
      monthlyRecords.push({
        month,
        'AIR FORCE': 0,
        ARMY: 0,
        CIVIL: 0,
        NAVY: 0,
        ...armOfServiceNumbers,
      });
    }
    return monthlyRecords;
  },

  groupByQuarter(data) {
    const groupedByQuarter = data.reduce(
      (acc, row) => {
        const quarter = moment(row.month).quarter();
        if (!acc[quarter]) {
          acc[quarter] = [row];
        } else {
          acc[quarter].push(row);
        }
        return acc;
      },
      { 1: [], 2: [], 3: [], 4: [] }
    );

    const quarterlyRecords = [];
    for (let [quarter, records] of Object.entries(groupedByQuarter)) {
      const armOfServiceNumbers = records.reduce(
        (acc, record) => {
          if (!acc[record.armOfService]) {
            acc[record.armOfService] = Number(record.amount);
          } else {
            acc[record.armOfService] += Number(record.amount);
          }
          acc.total += Number(record.amount);
          return acc;
        },
        { total: 0 }
      );
      quarterlyRecords.push({
        quarter,
        'AIR FORCE': 0,
        ARMY: 0,
        CIVIL: 0,
        NAVY: 0,
        ...armOfServiceNumbers,
      });
    }
    return quarterlyRecords;
  },

  groupBiannually(data) {
    const groupedBiannually = data.reduce(
      (acc, row) => {
        const half = moment(row.month).quarter() > 2 ? 2 : 1;
        if (!acc[half]) {
          acc[half] = [row];
        } else {
          acc[half].push(row);
        }
        return acc;
      },
      { 1: [], 2: [] }
    );

    const biannualRecords = [];
    for (let [half, records] of Object.entries(groupedBiannually)) {
      const armOfServiceNumbers = records.reduce(
        (acc, record) => {
          if (!acc[record.armOfService]) {
            acc[record.armOfService] = Number(record.amount);
          } else {
            acc[record.armOfService] += Number(record.amount);
          }
          acc.total += Number(record.amount);
          return acc;
        },
        { total: 0 }
      );
      biannualRecords.push({
        half,
        'AIR FORCE': 0,
        ARMY: 0,
        CIVIL: 0,
        NAVY: 0,
        ...armOfServiceNumbers,
      });
    }
    return biannualRecords;
  },

  computeTotals(data, computedDisplayData) {
    const totalByArmOfService = this.computeTotalByArmOfService(data);
    const overallTotal =
      this.computeOverallSumFromTotalByArmOfService(totalByArmOfService);

    // (OPTIONAL): COMPUTE OVERALL TOTAL FROM THE DISPLAY DATA BY MONTH/QUARTER/HALF
    const overallTotalCheck =
      this.totalFromComputedDisplay(computedDisplayData);

    return {
      totalByArmOfService: {
        ...totalByArmOfService,
        overallTotal: overallTotal,
      },
      overallTotal,
      overallTotalCheck,
    };
  },

  computeTotalByArmOfService(data) {
    return data.reduce((acc, record) => {
      if (!acc[record.armOfService]) {
        acc[record.armOfService] = Number(record.amount) || 0;
      } else {
        acc[record.armOfService] += Number(record.amount);
      }
      return acc;
    }, {});
  },

  computeOverallSumFromTotalByArmOfService(totalByArmOfService) {
    return Object.values(totalByArmOfService).reduce((acc, value) => {
      acc += Number(value) || 0;
      return acc;
    }, 0);
  },

  totalFromComputedDisplay(displayRecord) {
    return displayRecord.reduce((acc, record) => {
      acc += Number(record.total) || 0;
      return acc;
    }, 0);
  },
};

export default reportsFormatter;

module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface.sequelize.transaction((t) => {
      return Promise.all([
        queryInterface.changeColumn(
          'HealthCareProviders',
          'email',
          {
            type: Sequelize.STRING,
            allowNull: true,
          },
          { transaction: t }
        ),
        queryInterface.changeColumn(
          'HealthCareProviders',
          'phoneNumber',
          {
            type: Sequelize.STRING,
            allowNull: true,
          },
          { transaction: t }
        ),
        queryInterface.changeColumn(
          'HealthCareProviders',
          'accountType',
          {
            type: Sequelize.STRING,
            allowNull: true,
          },
          { transaction: t }
        ),
      ]);
    });
  },
  // eslint-disable-next-line no-unused-vars
  down: function (queryInterface, Sequelize) {
    return new Promise((res, _) => {
      return res();
    });
  },
};

module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface.sequelize.transaction((t) => {
      return Promise.all(
        ['email', 'accountNumber', 'phoneNumber', 'bank', 'accountType'].map(
          (field) =>
            queryInterface.changeColumn(
              'HealthCareProviders',
              field,
              {
                type: Sequelize.STRING,
                allowNull: true,
              },
              { transaction: t }
            )
        )
      );
    });
  },
  // eslint-disable-next-line no-unused-vars
  down: function (queryInterface, Sequelize) {
    return new Promise((res, _) => {
      return res();
    });
  },
};

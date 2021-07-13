module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface.sequelize.transaction((t) => {
      return Promise.all([
        queryInterface.changeColumn(
          'Enrollees',
          'bloodGroup',
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

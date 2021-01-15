'use strict';
module.exports = (sequelize, DataTypes) => {
  const Dependant = sequelize.define(
    'Dependant',
    {
      id: {
        allowNull: false,
        unique: true,
        primaryKey: true,
        type: DataTypes.STRING,
      },
      principalId: {
        type: DataTypes.STRING,
        references: {
          model: 'Principals',
          key: 'id',
        },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
      },
      relationshipToPrincipal: {
        type: DataTypes.STRING,
      },
      dependantClass: {
        type: DataTypes.STRING,
      },
      dependantType: {
        type: DataTypes.STRING,
      },
      hcpId: {
        allowNull: false,
        type: DataTypes.INTEGER,
        references: {
          model: 'HealthCareProviders',
          key: 'id',
        },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
      },
      scheme: {
        type: DataTypes.STRING,
      },
      surname: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      firstName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      middleName: {
        type: DataTypes.STRING,
      },
      rank: {
        type: DataTypes.STRING,
      },
      serviceNumber: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: true,
      },
      staffNumber: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: true,
      },
      title: {
        type: DataTypes.STRING,
      },
      designation: {
        type: DataTypes.STRING,
      },
      armOfService: {
        type: DataTypes.STRING,
      },
      department: {
        type: DataTypes.STRING,
      },
      employer: {
        type: DataTypes.STRING,
      },
      dateOfBirth: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      gender: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      maritalStatus: {
        type: DataTypes.STRING,
      },
      identificationType: {
        type: DataTypes.STRING, // idType
      },
      identificationNumber: {
        type: DataTypes.STRING, // idNumber
      },
      serviceStatus: {
        type: DataTypes.STRING,
      },
      phoneNumber: {
        type: DataTypes.STRING,
      },
      email: {
        type: DataTypes.STRING,
      },
      residentialAddress: {
        type: DataTypes.STRING,
      },
      stateOfResidence: {
        type: DataTypes.STRING,
      },
      lga: {
        type: DataTypes.STRING,
      },
      bloodGroup: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      significantMedicalHistory: {
        type: DataTypes.STRING,
      },
      photograph: {
        type: DataTypes.STRING,
      },
      birthCertificate: {
        type: DataTypes.STRING,
      },
      marriageCertificate: {
        type: DataTypes.STRING,
      },
      idCard: {
        type: DataTypes.STRING,
      },
      deathCertificate: {
        type: DataTypes.STRING,
      },
      letterOfNok: {
        type: DataTypes.STRING,
      },
    },
    {}
  );
  Dependant.associate = function (models) {
    Dependant.belongsTo(models.Principal, {
      foreignKey: 'principalId',
      as: 'principal',
    });
    Dependant.belongsTo(models.HealthCareProvider, {
      foreignKey: 'hcpId',
      as: 'hcp',
    });
  };
  Dependant.createDependant = async function (dependantData, principal) {
    dependantData.dependantClass =
      principal.scheme === dependantData.scheme
        ? 'same-scheme-dependant'
        : 'other-scheme-dependant';
    dependantData.dependantType = `${principal.scheme}-TO-${dependantData.scheme}`;
    const enrollee = await Dependant.create(dependantData);
    await enrollee.reload({
      include: [
        {
          model: enrollee.sequelize.models.HealthCareProvider,
          as: 'hcp',
          attributes: ['code', 'name'],
        },
      ],
    });
    return enrollee;
  };
  return Dependant;
};

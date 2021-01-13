'use strict';
// import { Op } from 'sequelize';
const { throwError } = require('../../shared/helpers');

module.exports = (sequelize, DataTypes) => {
  const Enrollee = sequelize.define(
    'Enrollee',
    {
      // enrolmentId: {
      //   type: DataTypes.STRING,
      //   allowNull: false,
      //   unique: true,
      // },
      // principalId: {
      //   type: DataTypes.INTEGER,
      //   references: {
      //     model: 'Enrollees',
      //     key: 'id',
      //   },
      //   onDelete: 'RESTRICT',
      //   onUpdate: 'CASCADE',
      // },
      id: {
        allowNull: false,
        unique: true,
        primaryKey: true,
        type: DataTypes.STRING,
      },
      principalId: {
        type: DataTypes.STRING,
        references: {
          model: 'Enrollees',
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
      },
      staffNumber: {
        type: DataTypes.STRING,
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
  // eslint-disable-next-line no-unused-vars
  Enrollee.associate = function (models) {
    Enrollee.belongsTo(models.HealthCareProvider, {
      foreignKey: 'hcpId',
      as: 'hcp',
    });
  };
  Enrollee.findBy = async function (
    field,
    value,
    options = { isRequired: false }
  ) {
    const found = await this.findOne({ where: { [field]: value } });
    if (!found && options.isRequired) {
      throwError({
        status: 404,
        error: [`no enrollee matches the ${field} of ${value}`],
      });
    }
    return found;
  };
  Enrollee.createPrincipal = async function (enrolleeData) {
    enrolleeData.id = await this.generatePrincipalId();
    return await this.create(enrolleeData);
  };
  Enrollee.prototype.addDependant = async function (
    dependantData,
    { transaction }
  ) {
    dependantData.id = await this.generateDependantId();
    return await Enrollee.create(dependantData, { transaction });
  };
  Enrollee.generatePrincipalId = async function () {
    const [lastRegisteredPrincipal] = await this.findAll({
      where: { principalId: null },
      order: [['createdAt', 'DESC']],
      limit: 1,
    });
    if (!lastRegisteredPrincipal) {
      return '124';
    } else {
      return Number(lastRegisteredPrincipal.id) + 1;
    }
  };
  Enrollee.prototype.generateDependantId = async function () {
    const [lastDependant] = await Enrollee.findAll({
      where: { principalId: this.id },
      order: [['createdAt', 'DESC']],
      limit: 1,
    });
    if (!lastDependant) {
      return `${this.id}-1`;
    } else {
      return `${this.id}-${Number(lastDependant.id.split('-')[1]) + 1}`;
    }
  };

  return Enrollee;
};

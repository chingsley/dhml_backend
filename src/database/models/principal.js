'use strict';

const { throwError } = require('../../shared/helpers');
const { zeroPadding } = require('../../utils/helpers');
const { castIdToInt } = require('../scripts/princpal.scripts');

module.exports = (sequelize, DataTypes) => {
  const Principal = sequelize.define(
    'Principal',
    {
      id: {
        allowNull: false,
        unique: true,
        primaryKey: true,
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
  Principal.associate = function (models) {
    Principal.hasMany(models.Dependant, {
      foreignKey: 'principalId',
      as: 'dependants',
    });
    Principal.belongsTo(models.HealthCareProvider, {
      foreignKey: 'hcpId',
      as: 'hcp',
    });
  };
  Principal.createPrincipal = async function (enrolleeData) {
    const enrollee = await Principal.create(enrolleeData);
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
  Principal.generateNewPrincipalId = async function () {
    const { dialect } = sequelize.options;
    const [lastRegisteredPrincipal] = await Principal.findAll({
      where: sequelize.where(sequelize.literal(castIdToInt(dialect)), '>', 230),
      order: [['createdAt', 'DESC']],
      limit: 1,
    });
    if (!lastRegisteredPrincipal) {
      return zeroPadding(231);
    } else {
      return zeroPadding(Number(lastRegisteredPrincipal.id) + 1);
    }
  };

  Principal.prototype.generateNewDependantId = function () {
    const [lastDependant] = this.dependants.sort(
      (d1, d2) => d2.createdAt - d1.createdAt
    );
    if (!lastDependant) {
      return `${this.id}-1`;
    } else {
      return `${this.id}-${Number(lastDependant.id.split('-')[1]) + 1}`;
    }
  };
  Principal.prototype.checkDependantLimit = function (newDependant) {
    if (
      this.scheme === newDependant.scheme &&
      newDependant.scheme !== 'VCSHIP'
    ) {
      const sameSchemeDependants = this.dependants.filter(
        (depndt) => depndt.scheme === this.scheme
      );
      if (sameSchemeDependants.length > 4) {
        const errorMsg = `The principal, ${this.firstName} ${this.surname}, has reached the limit(5) of allowed dependants under ${newDependant.scheme}`;
        throwError({
          status: 400,
          error: [errorMsg],
        });
      }
    }
  };
  Principal.findOneWhere = async function (condition, options) {
    const {
      throwErrorIfNotFound = false,
      errorMsg = 'Record not found',
      include = [],
    } = options;
    const found = await this.findOne({
      where: { ...condition },
      include,
    });
    if (!found && throwErrorIfNotFound) {
      throwError({
        status: 404,
        error: [errorMsg],
        errorCode: options.errorCode,
      });
    }
    return found;
  };

  return Principal;
};

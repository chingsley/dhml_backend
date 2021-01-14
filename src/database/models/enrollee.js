'use strict';
const { throwError } = require('../../shared/helpers');

module.exports = (sequelize, DataTypes) => {
  const Enrollee = sequelize.define(
    'Enrollee',
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
    Enrollee.hasMany(models.Enrollee, {
      foreignKey: 'principalId',
      as: 'dependants',
    });
    Enrollee.belongsTo(models.Enrollee, {
      foreignKey: 'principalId',
      as: 'principal',
    });
    Enrollee.belongsTo(models.HealthCareProvider, {
      foreignKey: 'hcpId',
      as: 'hcp',
    });
  };
  Enrollee.createPrincipal = async function (enrolleeData) {
    enrolleeData.id = await this.generatePrincipalId();
    return await this.create(enrolleeData);
  };
  Enrollee.prototype.addDependant = async function (dependantData) {
    dependantData.id = await this.generateDependantId();
    return await Enrollee.create(dependantData);
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
    const [lastDependant] = this.dependants.sort(
      (d1, d2) => d2.createdAt - d1.createdAt
    );
    if (!lastDependant) {
      return `${this.id}-1`;
    } else {
      return `${this.id}-${Number(lastDependant.id.split('-')[1]) + 1}`;
    }
  };
  Enrollee.prototype.checkDependantLimit = function (newDependant) {
    if (this.scheme === newDependant.scheme) {
      const sameSchemeDependants = this.dependants.filter(
        (depndt) => depndt.scheme === this.scheme
      );
      if (sameSchemeDependants.length > 4) {
        throwError({
          status: 400,
          error: [
            `The principal, ${this.firstName} ${this.surname}, has reached the limit(5) of allowed dependants under ${newDependant.scheme}`,
          ],
        });
      }
    }
  };
  Enrollee.findOneWhere = async function (condition, options) {
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

  return Enrollee;
};

'use strict';
import { QueryTypes } from 'sequelize';
const { throwError } = require('../../shared/helpers');
const { zeroPadding } = require('../../utils/helpers');
const { getLastRegisteredPrincipal } = require('../scripts/enrollee.scripts');

module.exports = (sequelize, DataTypes) => {
  const Enrollee = sequelize.define(
    'Enrollee',
    {
      enrolleeIdNo: {
        allowNull: false,
        unique: true,
        type: DataTypes.STRING,
      },
      principalId: {
        type: DataTypes.INTEGER,
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
        onDelete: 'CASCADE',
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
        references: {
          model: 'Staffs',
          key: 'staffIdNo',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
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
      isVerified: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      dateVerified: {
        type: DataTypes.DATE,
      },
      isPrincipal: {
        type: DataTypes.VIRTUAL,
        get() {
          return this.principalId === null;
        },
      },
      isDependant: {
        type: DataTypes.VIRTUAL,
        get() {
          return this.principalId !== null;
        },
      },
    },
    {}
  );
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
    const enrollee = await Enrollee.create(enrolleeData);
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
  Enrollee.createDependant = async function (dependantData, principal) {
    dependantData.dependantClass =
      principal.scheme === dependantData.scheme
        ? 'same-scheme-dependant'
        : 'other-scheme-dependant';
    dependantData.dependantType = `${principal.scheme}-TO-${dependantData.scheme}`;
    const enrollee = await Enrollee.create(dependantData);
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
  Enrollee.generateNewPrincipalIdNo = async function () {
    const { dialect, database } = sequelize.options;
    const [lastRegisteredPrincipal] = await sequelize.query(
      getLastRegisteredPrincipal(dialect, database),
      {
        type: QueryTypes.SELECT,
      }
    );
    if (!lastRegisteredPrincipal) {
      return zeroPadding(231);
    } else {
      return zeroPadding(Number(lastRegisteredPrincipal.enrolleeIdNo) + 1);
    }
  };

  Enrollee.prototype.generateNewDependantIdNo = function () {
    const [lastDependant] = this.dependants.sort(
      (d1, d2) =>
        Number(d2.enrolleeIdNo.split('-')[1]) -
        Number(d1.enrolleeIdNo.split('-')[1])
    );
    if (!lastDependant) {
      return `${this.enrolleeIdNo}-1`;
    } else {
      return `${this.enrolleeIdNo}-${
        Number(lastDependant.enrolleeIdNo.split('-')[1]) + 1
      }`;
    }
  };
  Enrollee.prototype.checkDependantLimit = function (newDependant) {
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
  Enrollee.findOneWhere = async function (condition, options) {
    const {
      throwErrorIfNotFound = false,
      errorMsg = 'Record not found',
      include = [],
      status = 404,
    } = options;
    const found = await this.findOne({
      where: { ...condition },
      include,
    });
    if (!found && throwErrorIfNotFound) {
      throwError({
        status,
        error: [errorMsg],
        errorCode: options.errorCode,
      });
    }
    return found;
  };
  return Enrollee;
};

/* eslint-disable indent */
import db from '../../database/models';
import {
  AUTH003,
  ACCOUNT_NOT_FOUND_ERROR,
  AUTH004,
  ACCESS_DENIED,
  AUTH001,
  NO_DEFAULT_PASSWORD_USER,
  NO_EXPIRED_PASSWORD,
} from '../../shared/constants/errors.constants';
import { states } from '../../shared/constants/lists.constants';
import { BASIC } from '../../shared/constants/roles.constants';
import {
  HEADERS,
  QUERY,
  HEADERS_OR_QUERY,
} from '../../shared/constants/strings.constants';
import { rejectIf, throwError } from '../../shared/helpers';
import { isExpired } from '../../utils/helpers';
import Jwt from '../../utils/Jwt';
import Response from '../../utils/Response';
import { validateSchema } from '../../validators/joi/config';
import authSchema from '../../validators/joi/schemas/auth.schema';

export default class AuthMiddleware {
  static async validateLoginDetails(req, res, next) {
    try {
      const { joiFormatted } = await validateSchema(authSchema.login, req.body);
      req.body = joiFormatted;
      return next();
    } catch (error) {
      Response.handleError('validateLoginDetails', error, req, res, next);
    }
  }

  static async validatepasswordChangeDetails(req, res, next) {
    try {
      const { joiFormatted } = await validateSchema(
        authSchema.passwordChange,
        req.body
      );
      req.body = joiFormatted;
      return next();
    } catch (error) {
      Response.handleError(
        'validatepasswordChangeDetails',
        error,
        req,
        res,
        next
      );
    }
  }

  /**
   *
   * @param {array} allowedRoles
   * contains array of roles that are allowed
   * to access the endpoint. e.g .authorzie(['admin', 'superadmin])
   * If allowedRoles is not specified (undefined),
   * e.g AuthMiddleware.authorize() then anyone
   * with a valid token can acccess the endpoint
   */
  static authorize(allowedRoles, options = {}) {
    return async (req, res, next) => {
      try {
        const {
          rejectDefaultPassword = false,
          rejectExpiredPassword = false,
          tokenLocation = HEADERS,
        } = options;
        const token = this.getTokenFromRequest(req, tokenLocation);
        const { userId, hcpId } = this.verifyToken(token);
        let user, hcp;
        if (userId) user = await this.findUserById(userId);
        if (hcpId) hcp = await this.findHcpById(hcpId);
        const { password, role } = user ? user : hcp;
        if (rejectDefaultPassword) this.rejectDefaultPassword(password);
        if (rejectExpiredPassword) this.rejectExpiredPassword(password);
        this.authorizeUser(role, allowedRoles);
        req.user = user || hcp;
        const userType = user ? 'user' : 'hcp';
        req.userType = userType;
        req.user.userType = userType;
        req.user.userLocation = this.getUserLocation(req.user, userType);
        req.user.subjectId = user ? user.staffInfo.staffIdNo : hcp.code;
        return next();
      } catch (error) {
        return Response.handleError('authorize', error, req, res, next);
      }
    };
  }

  static getUserLocation(user, userType) {
    switch (userType) {
      case 'hcp':
        rejectIf(
          !user.state ||
            !states
              .map((state) => state.toLowerCase())
              .includes(user.state.toLowerCase()),
          {
            withError: 'Unknonwn HCP location, please contact administrator',
          }
        );
        return user.state;
      case 'user':
        rejectIf(
          !user.staffInfo.location ||
            !states
              .map((state) => state.toLowerCase())
              .includes(user.staffInfo.location.toLowerCase()),
          {
            withError: 'Unknonwn User location, please contact administrator',
          }
        );

        return user.staffInfo.location;
      default:
        throwError({
          error: `invalid user type (${userType}). User can either be of type of 'user' or 'hcp', please contact the technical team`,
          status: 500,
        });
    }
  }

  static getTokenFromRequest(req, tokenLocation) {
    let token;
    const validTokenLocations = [HEADERS, QUERY, HEADERS_OR_QUERY];
    if (tokenLocation === HEADERS) {
      token = req.headers.authorization;
    } else if (tokenLocation === QUERY) {
      token = req.query.token;
    } else if (tokenLocation === HEADERS_OR_QUERY) {
      token = req.headers.authorization || req.query.token;
    } else {
      throw new Error(
        `option "tokenLocation" for the "authorize" middleware must be one of ${validTokenLocations.join(
          ', '
        )}`
      );
    }
    if (!token) {
      throwError({
        status: 401,
        error: [
          `Access denied. Missing authorization token in request ${tokenLocation}`,
        ],
        errorCode: AUTH001,
      });
    }
    return token;
  }

  static authorizeRoleAssignment = (allowedRoles) => async (req, res, next) => {
    try {
      const { role: operatorRole } = req.user;
      const { roleId } = req.body;
      if (!roleId) {
        return next();
      }
      const selectedRole = await this.findRoleById(roleId);
      const canChangeRole = allowedRoles.includes(operatorRole.title);
      const selectedRoleIsNotBasic = selectedRole.title !== BASIC;
      if (!canChangeRole && selectedRoleIsNotBasic) {
        throwError({
          status: 401,
          error: ['You are only authorized to assign the "basic" role'],
        });
      }
      return next();
    } catch (error) {
      return Response.handleError(
        'authorizeRoleAssignment',
        error,
        req,
        res,
        next
      );
    }
  };

  static async validateAuthData(req, res, next) {
    try {
      const { joiFormatted } = await validateSchema(
        authSchema.resendDefaultPass,
        req.body
      );
      req.body = joiFormatted;
      return next();
    } catch (error) {
      return Response.handleError('validateAuthData', error, req, res, next);
    }
  }

  static async validateRequestForPasswordReset(req, res, next) {
    try {
      const { joiFormatted } = await validateSchema(
        authSchema.requestPasswordReset,
        req.body
      );
      req.body = joiFormatted;
      return next();
    } catch (error) {
      return Response.handleError(
        'validateRequestForPasswordReset',
        error,
        req,
        res,
        next
      );
    }
  }

  static findUserById(userId) {
    return db.User.findOneWhere(
      { id: userId },
      {
        include: [
          { model: db.Role, as: 'role' },
          { model: db.Password, as: 'password' },
          { model: db.Staff, as: 'staffInfo' },
        ],
        throwErrorIfNotFound: true,
        errorMsg: ACCOUNT_NOT_FOUND_ERROR,
        errorCode: AUTH003,
      }
    );
  }

  static findHcpById(hcpId) {
    return db.HealthCareProvider.findOneWhere(
      { id: hcpId },
      {
        include: [
          { model: db.Role, as: 'role' },
          { model: db.Password, as: 'password' },
        ],
        throwErrorIfNotFound: true,
        errorMsg: ACCOUNT_NOT_FOUND_ERROR,
        errorCode: AUTH003,
        status: 401,
      }
    );
  }

  static findRoleById(roleId) {
    return db.Role.findOneWhere(
      { id: roleId },
      {
        throwErrorIfNotFound: true,
      }
    );
  }

  static verifyToken = (token) => {
    const { userId, hcpId } = Jwt.decode(token);
    return { userId, hcpId };
  };

  static rejectDefaultPassword = (password) => {
    if (password.isDefaultValue) {
      throwError({
        status: 401,
        error: [NO_DEFAULT_PASSWORD_USER],
      });
    }
  };
  static rejectExpiredPassword = (password) => {
    if (isExpired(password.expiryDate)) {
      throwError({
        status: 401,
        error: [NO_EXPIRED_PASSWORD],
      });
    }
  };

  static authorizeUser(userRole, allowedRoles) {
    //if there is no list of allowed roles, then any role is allowed
    // and all users are authorized
    if (!allowedRoles) return true;

    // if there is a list of allowed roles and userRole is
    // not in that list then user is not authorized
    if (!allowedRoles.includes(userRole.title)) {
      throwError({
        status: 401,
        error: [ACCESS_DENIED],
        errorCode: AUTH004,
      });
    }
    return true;
  }
}

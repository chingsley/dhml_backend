/* eslint-disable no-unused-vars */
/* eslint-disable quotes */
const errorCodes = {
  E001: `No principal has the supplied enrolment id. Either it does not exist, or you supplied a dependant enrolment id as principal`,
  LGN001: 'No staff/hcp matches the specified email',
  LGN002: `Staff was found with email, but staff is not found in Users table, b/c staff is not yet registered as a user`,
  LGN003: 'Input password does not match saved password',
  AUTH001: `Missing token in req.headers (or req.query for download_manifest endpoint)`,
  AUTH002: `Token is invalid. Could not be decoded with the app JWT_SECRET, which means token is incorrect or expired`,
  AUTH003: `Token is valid, but the userId encoded in the token subject does not point to any user in the db. The account not found in the db`,
  AUTH004: `User does not have the priveledge. E.g an admin user attempting an endpoint reserved for superadmin users`,
};

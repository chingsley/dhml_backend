export const getUnregisteredStaffs = (dialect, dbName) => {
  const query = {
    postgres: `
    SELECT s."staffIdNo", s."firstName", s."surname"
    FROM "Staffs" s
    LEFT JOIN "Users" u
      ON s."staffIdNo" = u."staffIdNo"
      WHERE u."staffIdNo" IS NULL;
    `,
    mysql: `
    SELECT s.staffIdNo, s.firstName, s.surname FROM ${dbName}.Staffs AS s
    LEFT JOIN ${dbName}.Users AS u
	  ON s.staffIdNo = u.staffIdNo
    WHERE u.staffIdNo IS NULL;
    `,
  };
  return query[dialect];
};

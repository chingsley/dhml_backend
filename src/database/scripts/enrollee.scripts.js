export const castIdToInt = (dialect) => {
  const query = {
    postgres: 'cast("id" as INTEGER)',
    mysql: 'cast(id as UNSIGNED)',
  };
  return query[dialect];
};

export const getLastRegisteredPrincipal = (dialect, dbName) => {
  const query = {
    postgres: `
    SELECT *
    FROM 
    (
      SELECT *
        FROM "Enrollees" e
        WHERE e."principalId" IS NULL
    ) sub
    WHERE cast("enrolleeIdNo" as INTEGER) > 230
    ORDER BY sub."enrolleeIdNo" DESC
    LIMIT 1;
    `,

    mysql: `
    SELECT * 
    FROM  
        (SELECT * FROM ${dbName}.Enrollees  
        WHERE principalId IS NULL) AS sub
        WHERE CAST(enrolleeIdNo AS UNSIGNED) > 230
        ORDER BY sub.enrolleeIdNo DESC
        LIMIT 1;
    `,
  };
  return query[dialect];
};

export const getReservedPrincipalIDs = (dialect, dbName) => {
  const query = {
    postgres: `
    SELECT cast("enrolleeIdNo" as INTEGER) AS "enrolleeIdNo"
    FROM 
    (
      SELECT *
        FROM "Enrollees" e
        WHERE e."principalId" IS NULL
    ) sub
    WHERE cast("enrolleeIdNo" as INTEGER) < 230
    ORDER BY sub."enrolleeIdNo" ASC;
    `,
    mysql: `
    SELECT cast(enrolleeIdNo as UNSIGNED) AS enrolleeIdNo
    FROM  
        (SELECT * FROM ${dbName}.Enrollees  
        WHERE principalId IS NULL) AS sub
        WHERE CAST(enrolleeIdNo AS UNSIGNED) < 231
        ORDER BY sub.enrolleeIdNo ASC;
    `,
  };
  return query[dialect];
};

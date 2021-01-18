export const castIdToInt = (dialect) => {
  const query = {
    postgres: 'cast("id" as INTEGER)',
    mysql: 'cast(id as UNSIGNED)',
  };
  return query[dialect];
};

export const getLastRegisteredPrincipal = (dialect) => {
  const query = {
    postgres: `
    SELECT *
    FROM 
    (
      SELECT *
        FROM "Enrollees" e
        WHERE e."principalId" IS NULL
    ) sub
    WHERE cast("id" as INTEGER) > 230
    ORDER BY sub."id" DESC
    LIMIT 1;
    `,

    mysql: `
    SELECT * 
    FROM  
        (SELECT * FROM dhml.Enrollees  
        WHERE principalId IS NULL) AS sub
        WHERE CAST(id AS UNSIGNED) > 230
        ORDER BY sub.id DESC
        LIMIT 1;
    `,
  };
  return query[dialect];
};

export const getReservedPrincipalIDs = (dialect) => {
  const query = {
    postgres: `
    SELECT cast("id" as INTEGER) AS id
    FROM 
    (
      SELECT *
        FROM "Enrollees" e
        WHERE e."principalId" IS NULL
    ) sub
    WHERE cast("id" as INTEGER) < 230
    ORDER BY sub."id" ASC;
    `,
    mysql: `
    SELECT cast(id as UNSIGNED) AS id
    FROM  
        (SELECT * FROM dhml.Enrollees  
        WHERE principalId IS NULL) AS sub
        WHERE CAST(id AS UNSIGNED) < 231
        ORDER BY sub.id ASC;
    `,
  };
  return query[dialect];
};

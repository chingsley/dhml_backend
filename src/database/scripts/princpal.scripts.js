export const castIdToInt = (dialect) => {
  const query = {
    postgres: 'cast("id" as INTEGER)',
    mysql: 'cast(id as UNSIGNED)',
  };
  return query[dialect];
};

'use strict';

module.exports = {
  // eslint-disable-next-line no-unused-vars
  up: (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert('Projects', [
      {
        name: 'kc-portfolio',
        githubLink: 'https://github.com/chingsley/kc-portfolio-backend',
        description:
          'A portfolio website. Aims to delineate a user"s resume, achievements and job qualifications',
        stack: 'Postgres, Nodejs, Express, React and Redux',
        technologies: 'Sequelize, Send grid, cloudinary',
        demoLink:
          'https://drive.google.com/file/d/1RLTJ4qdG3jTcADJpuNzAfDZ4fL-mMpxe/view?usp=sharing',
        userId: 1,
      },
    ]);
  },

  // eslint-disable-next-line no-unused-vars
  down: (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('Projects', null, {});
  },
};

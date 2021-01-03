### My Backend Template

### Getting Started

1. Clone the repo
2. run `npm i` to install the necessary dependencies
3. create .env file and add the required constants as exemplified in .env.sample
4. run `npm start` to start the app
5. Refer to the `scripts` section in package.json to see all available command
6. To generate models and migration files (e.g to generate a model for Users entity), run the command: `sequelize model:generate --name User --attributes firstName:STRING,lastName:STRING,email:STRING,password:STRING`
7. To generate seed files, here is an e.g: `equelize seed:generate --name 002-users`

### see also

- [frontend template](https://github.com/chingsley/frontend-template)

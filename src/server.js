import express from 'express';
import fileUpload from 'express-fileupload';
import morgan from 'morgan';
import fs from 'fs';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import http from 'http';

import Notif from './utils/Notification';

import bodyParser from 'body-parser';
import dotenv from 'dotenv';

import swaggerDoc from './swagger.json';

import routes from './router';

dotenv.config();
const server = express();

server.use(helmet());
server.use(cors());
server.use(bodyParser.urlencoded({ extended: true }));
server.use(bodyParser.json());
server.use(
  fileUpload({
    limits: { fileSize: 50 * 1024 * 1024 },
    useTempFiles: true,
    tempFileDir: '/tmp/',
  })
);

server.use(
  morgan('dev', {
    skip: () => (process.env.NODE_ENV === 'test' ? true : false),
  })
);

if (process.env.NODE_ENV === 'production') {
  const date = new Date();
  const filename =
    date.getDay() +
    '-' +
    date.getMonth() +
    '-' +
    date.getFullYear() +
    'logger.logs';
  server.use(
    morgan('common', {
      skip: (req, res) => res.statusCode < 400,
      stream: fs.createWriteStream(path.join(__dirname, filename), {
        flags: 'a',
      }),
    })
  );
}

server.use('/api', routes);
server.use((error, req, res, next) => {
  if (error) {
    if (typeof error === 'object') {
      res.status(500).json({ errors: [error.message] });
    } else {
      res.status(500).json({ errors: [error] });
    }
  } else {
    next();
  }
});

server.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDoc));

server.all(['/', '/ping'], function (req, res) {
  res.status(200).json('success');
});

server.use(function (req, res) {
  res.status(404).json({ errors: ['path not found'] });
});

const socketServer = http.createServer(server);
const Notification = new Notif(socketServer);
Notification.start();

export default { server, Notification };

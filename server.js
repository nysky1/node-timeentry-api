'use strict';
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const morgan = require('morgan');
const passport = require('passport');
const bodyParser = require('body-parser');

const {router: usersRouter} = require('./routes/users');
const {router: activitiesRouter} = require('./routes/activities');

mongoose.Promise = global.Promise;
 
const { PORT, DATABASE_URL } = require('./config');
const CORS = require('./middleware/cors');

const app = express();

app.use(morgan('common'));

// Body Parser
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// middle-ware - follow up (not executed)
app.use(CORS.setCORS); 

//routes
app.use('/api', usersRouter);
app.use('/api', activitiesRouter);

let server;

function runServer(databaseUrl, port = PORT) {

  return new Promise((resolve, reject) => {
    mongoose.connect(databaseUrl, err => {
      if (err) {
        return reject(err);
      }
      server = app.listen(port, () => {
        console.log(`Your app is listening on port ${port}`);
        resolve();
      })
        .on('error', err => {
          mongoose.disconnect();
          reject(err);
        });
    });
  });
}

function closeServer() {
  return mongoose.disconnect().then(() => {
    return new Promise((resolve, reject) => {
      console.log('Closing server');
      server.close(err => {
        if (err) {
          return reject(err);
        }
        resolve();
      });
    });
  });
}
if (require.main === module) {
    runServer(DATABASE_URL).catch(err => console.error(err));
  }
  
  module.exports = { app, runServer, closeServer };
const express = require('express');
const router = express.Router();
const passport = require('passport');
const jwt = require('jsonwebtoken');

const requiredFields = require('../middleware/required.fields');
const errorParser = require('../helpers/errorParser.helper');
const disableWithToken = require('../middleware/disableWithToken').disableWithToken;
const { User } = require('../models/user');

/* GET users listing. */
router.route('/users')
  .get((req, res) => {
    User.find()
    .then( (results) => {
      res.status(200).json(results).send();
    })
    .catch( (err) => {
      res.status(400).json(errorParser.generateErrorResponse(err))
    })
  })
  .post(disableWithToken,requiredFields('username','password','firstName','lastName','email'), (req, res) => {
    let {username, password, firstName, lastName, email} = req.body;
    User.create({
      username: username,
      password: password,
      firstName: firstName,
      lastName: lastName,
      email: email
    })
      .then(() => res.status(201).send())
      .catch( (err) => {
        res.status(400).json(errorParser.generateErrorResponse(err))}
      );
  })

module.exports = { router };

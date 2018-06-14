const express = require('express');
const router = express.Router();
const passport = require('passport');
const jwt = require('jsonwebtoken');

const config = require('../config');
const { messages } = require('../constants/constants');

const requiredFields = require('../middleware/required.fields');
const stringFields = require('../middleware/string.fields');
const trimFields = require('../middleware/trim.fields');
const errorParser = require('../helpers/errorParser.helper');
const disableWithToken = require('../middleware/disableWithToken').disableWithToken;
const { User } = require('../models/user');
const { Activity } = require('../models/activity');

require('../strategy/jwt.strategy')(passport);

router.route('/login')
  .post(disableWithToken,
    requiredFields('username', 'password'),
    (req, res) => {
      User.findOne({ username: req.body.username })
        .then(result => {
          if (!result) {
            res.status(400).json({ generalMessage: messages.authenticationMessages.missingAccount });
          }
          return result;
        })
        .then(existingUser => {
          existingUser.comparePassword(req.body.password)
            .then(isUserInfoCorrect => {
              if (!isUserInfoCorrect) {
                res.status(400).json({ generalMessage: messages.authenticationMessages.badPassword });
              }
              const tokenPayload = {
                _id: foundUser._id,
                email: foundUser.email,
                username: foundUser.username,
                role: foundUser.role,
              };
              const token = jwt.sign(tokenPayload, config.JWT_SECRET, {
                expiresIn: config.JWT_EXPIRY,
              });
              return res.json({ token: `Bearer ${token}` });
            })
        })
        .catch(report => res.status(400).json(errorsParser.generateErrorResponse(report)));
    }
  )

router.route('/users/:id')
  .get((req, res) => {
    User.findById(req.params.id)
      .populate('events', 'eventName')
      .then(user => {
        res.status(200).json(user.serialize()).send
      })
      .catch((err) => {
        res.status(400).json(errorParser.generateErrorResponse(err));
      })
  })

/* GET users listing. */
router.route('/users')
  .get((req, res) => {
    User.find()
      .then(users => {
        res.status(200).json(
          users.map(user => user.serialize())
        )
      })
      .catch((err) => {
        res.status(400).json(errorParser.generateErrorResponse(err));
      })
  })
  .post(disableWithToken,
    requiredFields('username', 'password', 'firstName', 'lastName', 'email'),
    stringFields('username', 'password', 'firstName', 'lastName', 'email'),
    trimFields('username', 'password'),
    (req, res) => {
      let { username, password, firstName, lastName, email } = req.body;
      firstName = firstName.trim(); lastName = lastName.trim(); email = email.trim();
      User.create({
        username: username,
        password: password,
        firstName: firstName,
        lastName: lastName,
        email: email
      })
        .then((newUser) => res.status(201).json(newUser.serialize()))
        .catch((err) => {
          res.status(400).json(errorParser.generateErrorResponse(err));
        });
    })
/* Add a Time entry to an existing user */
router.route('/users/:id/addActivity') //follow up, duration a string?
  .put(requiredFields('activity', 'activityDuration', 'activityDate'), stringFields('activity', 'activityDate'), (req, res) => {
    let { activity, activityDuration, activityDate } = req.body;
    Activity.create({
      activity: activity,
      activityDuration: activityDuration,
      activityDate: activityDate
    })
      .then((activity) => User.findByIdAndUpdate(req.params.id, { $push: { activities: activity._id } }, { new: true }))
      .then(updated => res.json(updated.serialize()))
      .catch((err) => {
        res.status(400).json(errorParser.generateErrorResponse(err));
      })
  })
router.route('/users/:id/removeActivity/:activityId')
  .delete((req, res) => {
    Activity
      .findByIdAndRemove(req.params.activityId)
      .then((activity) => User.findByIdAndUpdate(req.params.id, { $pull: { activities: req.params.activityId } }, { new: true }))
      .then(updated => res.status(204).json())
      .catch((err) => {
        res.status(400).json(errorParser.generateErrorResponse(err));
      })
  })

module.exports = { router };

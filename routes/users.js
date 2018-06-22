const express = require('express');
const router = express.Router();
const passport = require('passport');
const jwt = require('jsonwebtoken');

const config = require('../config');
const { messages } = require('../constants/constants');

const requiredFields = require('../middleware/required.fields');
const privateFields = require('../middleware/private.fields');
const matchBody = require('../middleware/match.body');
const stringFields = require('../middleware/string.fields');
const trimFields = require('../middleware/trim.fields');
const errorParser = require('../helpers/errorParser.helper');
const disableWithToken = require('../middleware/disableWithToken').disableWithToken;
const { userHasRoutePermission, userHasAdminPermission } = require('../middleware/userHasPermission');

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
            //return is important //follow up (why no promise rejection)
            return res.status(400).json({ generalMessage: messages.authenticationMessages.missingAccount });
          }
          return result;
        })
        .then((existingUser) => {
          existingUser.validatePassword(req.body.password)
            .then((isUserInfoCorrect) => {
              if (!isUserInfoCorrect) {
                return res.status(400).json({ generalMessage: messages.authenticationMessages.badPassword });
              }
              const tokenPayload = {
                _id: existingUser._id,
                email: existingUser.email,
                username: existingUser.username,
                role: existingUser.role,
              };

              const token = jwt.sign(tokenPayload, config.JWT_SECRET, {
                expiresIn: config.JWT_EXPIRY,
              });
              return res.json({ token: `${token}` });
            })
        })
        .catch(report => res.status(400).json(errorParser.generateErrorResponse(report)));
    }
  )

router.route('/users/:id')
  .get(
    passport.authenticate('jwt', { session: false }),
    userHasRoutePermission,
    (req, res) => {
      User.findById(req.params.id)
        .populate('activities', 'activity activityDuration activityDate') //user model attribute
        .then(user => {
          res.status(200).json(user.serialize()).send
        })
        .catch((err) => {
          res.status(400).json(errorParser.generateErrorResponse(err));
        })
    })
/* Validate the token */
router.route('/loginValidate')
  .get(passport.authenticate('jwt', { session: false }),
    (req, res) => res.json(req.user)
  )

/* GET users listing. */
router.route('/users')
  .get(passport.authenticate('jwt', { session: false }),
    userHasAdminPermission,
    (req, res) => {
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
    privateFields('role'),
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
router.route('/users/:id/addActivity')
  .put(passport.authenticate('jwt', { session: false }),
    userHasRoutePermission,
    requiredFields('activity', 'activityDuration', 'activityDate'),
    stringFields('activity', 'activityDate'),
    matchBody('id'),
    (req, res) => {
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
  .delete(passport.authenticate('jwt', { session: false }),
    userHasRoutePermission,
    (req, res) => {
      Activity
        .findByIdAndRemove(req.params.activityId)
        .then((activity) => User.findByIdAndUpdate(req.params.id, { $pull: { activities: req.params.activityId } }, { new: true }))
        .then(updated => res.status(204).json())
        .catch((err) => {
          res.status(400).json(errorParser.generateErrorResponse(err));
        })
    })

/* Update an existing event. */
router.route('/users/:id/activities/:eventId')
  .put(
    requiredFields('activity', 'activityDuration', 'activityDate'),
    stringFields('activity', 'activityDate'),
    matchBody('id', 'eventId'),
    (req, res) => {
      if (!(req.params.id && req.body.id && req.params.id === req.body.id)) {
        const message = (
          `Request path id (${req.params.id}) and request body id ` +
          `(${req.body.id}) must match`);
        console.error(message);
        return res.status(400).json({ message: message });
      }
      const activityToUpdate = {};
      const updateableFields = ['activity', 'activityDuration', 'activityDate'];
      updateableFields.forEach(field => {
        if (field in req.body) {
          activityToUpdate[field] = req.body[field];
        }
      });
      Activity
        .findByIdAndUpdate(req.params.eventId, { $set: activityToUpdate })
        .then(activity => res.status(200).json('OK'))
        .catch(err => res.status(500).json(errorParser.generateErrorResponse(err)))

    });

module.exports = { router };

const express = require('express');
const router = express.Router();
const passport = require('passport');
const jwt = require('jsonwebtoken');

const requiredFields = require('../middleware/required.fields');
const errorParser = require('../helpers/errorParser.helper');
const disableWithToken = require('../middleware/disableWithToken').disableWithToken;
const { User } = require('../models/user');
const { Activity } = require('../models/activity');

router.route('/users/:id')
  .get((req, res) => {
    User.findById(req.params.id)
      .populate('events', 'eventName')
      .then((user) => {
        res.status(200).json(user).send();
      })
      .catch((err) => {
        res.status(400).json(errorParser.generateErrorResponse(err));
      })
  })

/* GET users listing. */
router.route('/users')
  .get((req, res) => {
    User.find()
      .then((results) => {
        res.status(200).json(results).send();
      })
      .catch((err) => {
        res.status(400).json(errorParser.generateErrorResponse(err));
      })
  })
  .post(disableWithToken, requiredFields('username', 'password', 'firstName', 'lastName', 'email'), (req, res) => {
    let { username, password, firstName, lastName, email } = req.body;
    console.log('post');
    User.create({
      username: username,
      password: password,
      firstName: firstName,
      lastName: lastName,
      email: email
    })
      .then(() => res.status(201).send())
      .catch((err) => {
        res.status(400).json(errorParser.generateErrorResponse(err));
      });
  })
/* Add a Time entry to an existing user */  
router.route('/user/:id/addActivity')
  .post(requiredFields('activity','activityDuration','activityDate'),(req, res) => {
    let { activity,activityDuration,activityDate } = req.body;
    Activity.create({
      activity: activity,
      activityDuration: activityDuration,
      activityDate: activityDate
    })
      .then((activity) => User.findByIdAndUpdate(req.params.id, { $push: { activities: activity._id } }, { new: true }))
      .then(updated => res.json(updated))
      .catch((err) => {
        res.status(400).json(errorParser.generateErrorResponse(err));
      })
  })
  router.route('/user/:id/removeActivity/:activityId')
  .get((req, res) => {
    Activity
      .findByIdAndRemove(req.params.activityId)
      .then((activity) => User.findByIdAndUpdate(req.params.id, { $pull: { activities: req.params.activityId } }, { new: true }))
      .then(updated => res.json(updated))
      .catch((err) => {
        res.status(400).json(errorParser.generateErrorResponse(err));
      })
  })

module.exports = { router };

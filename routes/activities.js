var express = require('express');
var router = express.Router();

const { User } = require('../models/user');
const { Activity } = require('../models/activity');

const requiredFields = require('../middleware/required.fields');
const stringFields = require('../middleware/string.fields');

const errorParser = require('../helpers/errorParser.helper');

/* Update an existing event. */
router.route('/events/:id')
  .put(
    requiredFields('activity','activityDuration','activityDate'),
    stringFields('activity','activityDate'),
    (req, res) => {
    if (!(req.params.id && req.body.id && req.params.id === req.body.id)) {
      const message = (
        `Request path id (${req.params.id}) and request body id ` +
        `(${req.body.id}) must match`);
      console.error(message);
      return res.status(400).json({ message: message });
    }
    const activityToUpdate = {};
    const updateableFields = ['activity','activityDuration','activityDate'];
    updateableFields.forEach(field => {
      if (field in req.body) {
        activityToUpdate[field] = req.body[field];
      }
    });
    Activity
    .findByIdAndUpdate (req.params.id, {$set: activityToUpdate})
    .then(activity => res.status(200).end())
    .catch(err => res.status(500).json(errorParser.generateErrorResponse(err)))
    
  });

module.exports = { router };

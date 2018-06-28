'use strict';
const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const ActivitySchema = new mongoose.Schema({
    activity: {
        type: String,
        required: true
    },
    activityDuration: {
        type: String,
        required: true
    },
    activityDate: {
        type: String,
        required: true
    }
}, {
    timestamps: true,
});

const Activity = mongoose.model('Activity', ActivitySchema);

module.exports = {Activity};

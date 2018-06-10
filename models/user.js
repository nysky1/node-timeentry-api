'use strict';
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const {messages} = require('../constants/constants'); 
const {PASSWORD_HASH_ITERATIONS} = require('../config');

mongoose.Promise = global.Promise;

const UserSchema = mongoose.Schema({
  username: {
    type: String,
    required: true,
    lowercase: true,
    unique: true,
    minlength: [6, messages.validationMessages.usernameLength],
  },
  password: {
    type: String,
    required: true,
    minlength: [8, messages.validationMessages.passwordLength],
    maxlength: [72, messages.validationMessages.passwordMaxLength],
  },
  firstName: {
    type: String,
    required: true,
    minlength: [2, messages.validationMessages.firstNameLength]
  },
  lastName: {
    type: String,
    required: true,
    minlength: [2, messages.validationMessages.lastNameLength]
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    unique: true,
    //,validate: validator.isEmail //follow-up
  },
});

UserSchema.methods.serialize = function () {
  return {
    username: this.username || '',
    firstName: this.firstName || '',
    lastName: this.lastName || '',
    email: this.email || ''
  };
};

UserSchema.plugin(uniqueValidator, { message: messages.validationMessages.uniqueField });

UserSchema.methods.validatePassword = function (password) {
  return bcrypt.compare(password, this.password);
};

UserSchema.statics.hashPassword = function (password) {
  return bcrypt.hash(password, PASSWORD_HASH_ITERATIONS);
};

UserSchema.pre('save', function userPreSave(next) {
  const user = this;
  if (this.isModified('password') || this.isNew) {
    return bcrypt.hash(user.password, PASSWORD_HASH_ITERATIONS)
      .then((hash) => {
        user.password = hash;
        return next();
      })
      .catch(err => next(err));
  }
  return next();
});

const User = mongoose.model('User', UserSchema);

module.exports = { User };

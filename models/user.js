'use strict';
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
mongoose.Promise = global.Promise;

const UserSchema = mongoose.Schema({
  username: {
    type: String,
    required: true,
    lowercase: true,
    unique: true,
    minlength: [6, 'The username should be at least 6 characters'],
  },
  password: {
    type: String,
    required: true,
    minlength: [8, 'The password should be at least 8 characters'],
    maxlength: [72, 'Whoa there cowboy, keep the password below 72 characters'],
  },
  firstName: { type: String, required: true, minlength: [2, 'First name should be at least 2 characters'] },
  lastName: { type: String, required: true, minlength: [2, 'First name should be at least 2 characters'] },
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

UserSchema.plugin(uniqueValidator);

UserSchema.methods.validatePassword = function (password) {
  return bcrypt.compare(password, this.password);
};

UserSchema.statics.hashPassword = function (password) {
  return bcrypt.hash(password, 10);
};

UserSchema.pre('save', function userPreSave(next) {
  const user = this;
  if (this.isModified('password') || this.isNew) {
      return bcrypt.hash(user.password, 10)
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

'use strict';
exports.DATABASE_URL = process.env.DATABASE_URL || 'mongodb://localhost/time-tracker';
exports.TEST_DATABASE_URL = process.env.TEST_DATABASE_URL || 'mongodb://localhost/test-time-tracker';
exports.PORT = process.env.PORT || 8080;
exports.PASSWORD_HASH_ITERATIONS = 10;
exports.JWT_SECRET = process.env.JWT_SECRET || 'figs have wasps inside so i do not engage';
exports.JWT_EXPIRY = process.env.JWT_EXPIRY || '7d';
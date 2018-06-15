const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const {User} = require('../models/user.js');
const config = require('../config');

module.exports = (passport) => {
    const options = {};
    options.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
    options.secretOrKey = config.JWT_SECRET;
    passport.use(new JwtStrategy(options, (jwtPayload, done) => {
        User.findById(jwtPayload._id)
            .then((user) => {
                if (user) {
                    const userData = {
                        _id: user._id,
                        email: user.email,
                        username: user.username,
                        role: user.role,
                    };
                    done(null, userData);
                } else {
                    done(null, false);
                }
            })
            .catch(error => done(error, false));
    }));
};

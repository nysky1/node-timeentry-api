'use strict';

const chai = require('chai');
const chaiHttp = require('chai-http');
const faker = require('faker');
const mongoose = require('mongoose');

const expect = chai.expect;

const { User } = require('../models/user');
const { app, runServer, closeServer } = require('../server');
const { TEST_DATABASE_URL } = require('../config');

chai.use(chaiHttp);

function seedUserData() {
    console.info('Seeding user data');
    const seedData = [];

    for (let i = 1; i <= 10; i++) {
        seedData.push(generateUserData());
    }
    // this will return a promise
    return User.insertMany(seedData);
}
//unique test fields
function generateRandomSuffix() {
    return Math.floor(Math.random() * 5000);
}
function generateFirstName() {
    const firstNames = ['Jim', 'Bob', 'John'];
    return firstNames[Math.floor(Math.random() * firstNames.length)];
}
function generateLastName() {
    const lastNames = ['Smith', 'Miller', 'Shrute', 'Gold'];
    return lastNames[Math.floor(Math.random() * lastNames.length)];
}
function generatePassword() {
    const passwords = ['joebob1234', 'joebob2345', 'joebob3456', 'joebob4567'];
    return passwords[Math.floor(Math.random() * passwords.length)];
}
describe('User API Resource', function () {
    before(function () {
        return runServer(TEST_DATABASE_URL);
    });
    beforeEach(function () {
        return seedUserData();
    });

    afterEach(function () {
        return tearDownDb();
    });

    after(function () {
        return closeServer();
    });
    describe('GET endpoint', function () {
        it('should return with all users', function () {
            let res;
            return chai.request(app)
                .get('/api/users')
                .then(function (_res) {
                    res = _res;
                    expect(res).to.have.status(200);
                    expect(res.body).to.have.lengthOf.at.least(1);
                    return User.count();
                })
                .then(function (count) {
                    expect(res.body).to.have.lengthOf(count);
                })

        })
        //follow up (condition to ensure user results not in production)
        it('should contain the expected fields', function () {
            let resBlog;
            chai.request(app)
                .get('/api/users')
                .then(function (res) {
                    expect(res).to.have.status(200);
                    expect(res).to.be.json;
                    expect(res.body).to.have.lengthOf.at.least(1);
                    expect(res.body).to.be.a('array');

                    res.body.forEach(function (user) {
                        expect(user).to.be.a('object');
                        expect(user).to.include.keys(
                            '_id', 'username', 'password', 'firstName', 'lastName', 'email'
                        );
                    });

                })
        })
    });

});

function generateUserData() {
    return {
        username: faker.internet.userName() + generateRandomSuffix(),
        password: generatePassword(),
        firstName: generateFirstName(),
        lastName: generateLastName(),
        email: faker.internet.email() + generateRandomSuffix()
    }
}

function tearDownDb() {
    console.warn('Deleting database');
    return mongoose.connection.dropDatabase();
}
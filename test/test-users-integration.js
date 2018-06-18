'use strict';

const chai = require('chai');
const chaiHttp = require('chai-http');
const faker = require('faker');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const passport = require('passport');

const expect = chai.expect;

const config = require('../config');
const { User } = require('../models/user');
const { app, runServer, closeServer } = require('../server');
const { TEST_DATABASE_URL } = require('../config');

require('../strategy/jwt.strategy')(passport);

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
//known user info
function seedStaticUserData() {
    console.info('Seeding static user data');
    const seedData = [];
    seedData.push(generateStaticUserData());

    // this will return a promise
    return User.create(seedData);
}
function seedStaticUserAdminData() {
    console.info('Seeding static user admin data');
    const seedData = [];
    seedData.push(generateStaticUserAdminData());

    // this will return a promise
    return User.create(seedData);
}

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
    const passwords = ['bob123456', 'bob234567', 'joebob3456', 'joebob4567'];
    return passwords[Math.floor(Math.random() * passwords.length)];
}
describe('User API Resource', function () {
    //static user id for authentication
    let newUserId
    let newAdminUserId;

    before(function () {
        return runServer(TEST_DATABASE_URL);
    });
    beforeEach(function () {
        return seedStaticUserData()
            .then(result => {
                //static user id for authentication (regular user)
                newUserId = result[0]._id;                
            })
            .then(seedStaticUserAdminData)
            .then(result => {
                //static user id for authentication (admin user)
                newAdminUserId = result[0]._id;
                return seedUserData();
            })
    });
    afterEach(function () {
        return tearDownDb();
    });
    after(function () {
        return closeServer();
    });
    
    describe('GET endpoint', function () {
        /* BEGIN /API/USERS */
        it('should return with all users (AUTH, Admin only)', function () {
            const tokenAdmin = jwt.sign({ _id: newAdminUserId, email: generateStaticUserAdminData().email, username: generateStaticUserAdminData().username, role: generateStaticUserAdminData().role }, config.JWT_SECRET, { expiresIn: config.JWT_EXPIRY });
            let res;
            return chai.request(app)
                .get('/api/users')
                .set('Authorization', `Bearer ${tokenAdmin}`)
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
        it('should contain the expected fields (AUTH, Admin only)', function () {
            const tokenAdmin = jwt.sign({ _id: newAdminUserId, email: generateStaticUserAdminData().email, username: generateStaticUserAdminData().username, role: generateStaticUserAdminData().role }, config.JWT_SECRET, { expiresIn: config.JWT_EXPIRY });
            return chai.request(app)
                .get('/api/users')
                .set('Authorization', `Bearer ${tokenAdmin}`)
                .then(function (res) {
                    expect(res).to.have.status(200);
                    expect(res).to.be.json;
                    expect(res.body).to.have.lengthOf.at.least(1);
                    expect(res.body).to.be.a('array');

                    res.body.forEach(function (user) {
                        expect(user).to.be.a('object');
                        expect(user).to.not.include.keys('password');
                        expect(user).to.include.keys(
                            '_id', 'username', 'firstName', 'lastName', 'email', 'activities', 'role'
                        );
                    });

                })
        })
        it('should fail returning all users (b/c AUTH but not ADMIN)', function () {
            const token = jwt.sign({ _id: newUserId, email: generateStaticUserData().email, username: generateStaticUserData().username, role: generateStaticUserData().role }, config.JWT_SECRET, { expiresIn: config.JWT_EXPIRY });
            let res;
            return chai.request(app)
                .get('/api/users')
                .set('Authorization', `Bearer ${token}`)
                .then(function (_res) {
                    res = _res;
                    expect(res).to.have.status(400);
                })
        })
        /* END   /API/USERS */
        /* BEGIN /API/USERS/ID */
        it('should return 1 user and have the expected fields (AUTH)', function () {
            let res;
            const token = jwt.sign({ _id: newUserId, email: generateStaticUserData().email, username: generateStaticUserData().username, role: generateStaticUserData().role }, config.JWT_SECRET, { expiresIn: config.JWT_EXPIRY });
            
            return User.findOne()
                .then(user => {
                    expect(user).to.not.be.empty;
                    return chai.request(app)
                        .get(`/api/users/${user._id}`)
                        .set('Authorization', `Bearer ${token}`)
                        .then(res => {
                            expect(res).to.have.status(200);
                            expect(res).to.be.json;
                            expect(res.body).to.be.a('object');
                            expect(res.body._id).to.not.equal(null);

                            expect(user).to.be.a('object');
                            expect(res.body).to.include.keys(
                                '_id', 'username', 'firstName', 'lastName', 'email', 'activities'
                            );
                        });
                })

        })
        /* END  /API/USERS/ID */
    })
    describe('PUT endpoint', function () {
        const activityItem = { activity: "Helped with grading", activityDuration: "1", activityDate: "6/11/2018" };        
        it('should add a user (NO AUTH) and update them with a new activity (AUTH)', function () {
            const newItem = { username: "jbtest1", firstName: "Test First", lastName: "Test Last", email: "aa@aa.com", password: "Te3tPassw0rd" };
            return chai.request(app)
                .post('/api/users')
                .send(newItem)
                .then(function (res) {
                    let newItemId = res.body._id;
                    activityItem.id = newItemId; //id must match param /:id
                    const token = jwt.sign({ _id: newItemId, email: newItem.email, username: newItem.username, role: res.body.role }, config.JWT_SECRET, { expiresIn: config.JWT_EXPIRY });

                    return chai.request(app)
                        .put(`/api/users/${newItemId}/addActivity`)
                        .set('Authorization', `Bearer ${token}`)
                        .send(activityItem)
                        .then(function (res) {
                            expect(res.body).to.be.a('object');
                            expect(res.body.activities).to.be.a('array');
                            expect(res.body.activities).to.have.lengthOf.at.least(1);

                        })
                })
        })
        it('should fail trying to update a user with a new activity (AUTH)', function () {
            const badDataActivityItemMissing = { activityDuration: "1", activityDate: "6/11/2018" };
            const token = jwt.sign({ _id: newUserId, email: generateStaticUserData().email, username: generateStaticUserData().username, role: generateStaticUserData().role }, config.JWT_SECRET, { expiresIn: config.JWT_EXPIRY });
        
            return chai.request(app)
                .post('/api/users')
                .set('Authorization', `Bearer ${token}`)
                .send(badDataActivityItemMissing)
                .then(function (res) {
                    let newItemId = res.body._id;
                    return chai.request(app)
                        .put(`/api/users/${newItemId}/addActivity`)
                        .set('Authorization', `Bearer ${token}`)
                        .send(activityItem)
                        .then(function (res) {
                            expect(res).to.have.status(400)
                        })
                })
        });
    })
    describe('POST endpoint', function () {
        const token = jwt.sign({ _id: newUserId, email: generateStaticUserData().email, username: generateStaticUserData().username, role: generateStaticUserData().role }, config.JWT_SECRET, { expiresIn: config.JWT_EXPIRY });
        it('should create a user with empty activities (NO AUTH)', function () {
            const newItem = { username: "jbtest1", firstName: "Test First", lastName: "Test Last", email: "aa@aa.com", password: "Te3tPassw0rd" };
            return chai.request(app)
                .post('/api/users')
                .send(newItem)
                .then(function (res) {
                    newItem._id = res.body.id;
                    expect(res).to.have.status(201);
                    expect(res).to.be.json;
                    expect(res.body).to.be.a('object');
                    expect(res.body._id).to.not.equal(null);

                    delete newItem.password;
                    expect(res.body).to.deep.equal(Object.assign(newItem, { _id: res.body._id, firstName: res.body.firstName, lastName: res.body.lastName, username: res.body.username, email: res.body.email, activities: [], role: res.body.role }));
                })
        });
        it('should fail creating a user as an admin (NO AUTH required)', function () {
            const newItem = { username: "jbtest1", firstName: "Test First", lastName: "Test Last", email: "aa@aa.com", password: "Te3tPassw0rd", role: "admin" };
            return chai.request(app)
                .post('/api/users')
                .send(newItem)
                    expect(res).to.have.status(400);
        });
        it('should fail creating a user due to bad data (NO AUTH required)', function () {
            const badDataItemExtraSpace = { username: "jbtest1 ", firstName: "Test First", lastName: "Test Last", email: "aa@aa.com", password: "Te3tPassw0rd" };
            //bad data test
            return chai.request(app)
                .post('/api/users')
                .send(badDataItemExtraSpace)
                .then(function (res) {
                    expect(res).to.have.status(400);
                    expect(res).to.be.json;
                    expect(res.body).to.be.a('object');
                    expect(res.body.generalMessage).to.not.be.empty;
                })
        })
        it('should authenticate a user and issue a bearer token (NO AUTH)', function () {
            const creds = { username: generateStaticUserData().username, password: generateStaticUserData().password }
            return chai.request(app)
                .post('/api/login')
                .send(creds)
                .then(res => {
                    expect(res).to.have.status(200);
                    expect(res).to.be.json;
                    expect(res.body).to.be.a('object');
                    expect(res.body.token).to.not.equal(null);
                    expect(res.body.token).to.not.equal(undefined);
                })
        })
        it('should fail authentication due to bad password (NO AUTH)', function () {
            const credsBad = { username: generateStaticUserData().username, password: 'BadPassword' }
            return chai.request(app)
                .post('/api/login')
                .send(credsBad)
                .then(res => {
                    expect(res.body).to.be.a('object');
                    expect(res).to.have.status(400);
                    expect(res).to.be.json;
                    expect(res.body.token).to.equal(undefined);
                })
        });
    });
    describe('DELETE endpoint', function () {  
        it('should delete an activity for a user (AUTH, AUTH, AUTH)', function () {
            const token = jwt.sign({ _id: newUserId, email: generateStaticUserData().email, username: generateStaticUserData().username, role: generateStaticUserData().role }, config.JWT_SECRET, { expiresIn: config.JWT_EXPIRY });
            return User.findById(newUserId)
                .then(user => {
                    expect(user).to.not.be.empty;
                    //get the user detail
                    return chai.request(app)
                        .get(`/api/users/${user._id}`)
                        .set('Authorization', `Bearer ${token}`)
                        .then(res => {
                            expect(res).to.have.status(200);
                            expect(res).to.be.json;
                            expect(res.body).to.be.a('object');
                            expect(res.body._id).to.not.equal(null);

                            expect(user).to.be.a('object');
                            expect(res.body).to.include.keys(
                                '_id', 'username', 'firstName', 'lastName', 'email', 'activities'
                            );
                            
                            const activityItem = { id: newUserId , activity: "Helped with grading", activityDuration: "1", activityDate: "6/11/2018" };
                            //update the user with an activitity
                            return chai.request(app)
                                .put(`/api/users/${newUserId}/addActivity`)
                                .set('Authorization', `Bearer ${token}`)
                                .send(activityItem)
                                .then(res => {
                                    expect(res).to.have.status(200);
                                    expect(res).to.be.json;
                                    expect(res.body).to.be.a('object');
                                    expect(res.body._id).to.not.equal(null);
                                    expect(res.body.activities[0]).to.not.equal(null);

                                    let activityId = res.body.activities[0];
                                    //remove the activity
                                    return chai.request(app)
                                        .delete(`/api/users/${newUserId}/removeActivity/${activityId}`)
                                        .set('Authorization', `Bearer ${token}`)
                                        .then(res => {
                                            expect(res).to.have.status(204);
                                            //check the activity is gone
                                            return chai.request(app)
                                                .get(`/api/users/${user._id}`)
                                                .set('Authorization', `Bearer ${token}`)
                                                .then(res => {
                                                    expect(res).to.have.status(200);
                                                    expect(res).to.be.json;
                                                    expect(res.body).to.be.a('object');
                                                    expect(res.body.activities).to.be.empty;
                                                })
                                        })
                                })
                        });
                })
        });
    });

});

function generateUserData() {
    return {
        username: 'jbtest1' + generateRandomSuffix(),
        password: generatePassword(),
        firstName: generateFirstName(),
        lastName: generateLastName(),
        email: faker.internet.email() + generateRandomSuffix()
    }
}
function generateStaticUserData() {
    return {
        username: 'jbtest1ab',
        password: 'TestPassw0rd',
        firstName: 'Jim',
        lastName: 'Smith',
        email: 'JimSmith@smith.com',
        role: 'user'
    }
}
function generateStaticUserAdminData() {
    return {
        username: 'jbtest1admin',
        password: 'TestPassw0rd',
        firstName: 'Jim',
        lastName: 'Smith',
        email: 'JimSmith@smithadmin.com',
        role: 'admin'
    }
}

function tearDownDb() {
    console.warn('Deleting database');
    return mongoose.connection.dropDatabase();
}
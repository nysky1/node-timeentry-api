'use strict'
const messages = {
    validationMessages: {
        uniqueField: 'Oops! That {PATH} is taken. Choose another.',
        /////////////////////////////////////////////////////////////
        usernameLength: 'The username should be at least 6 characters.',
        passwordLength: 'The password should be at least 8 characters.',
        passwordMaxLength: 'Whoa there cowboy, limit the password to 72 characters',
        firstNameLength: 'First name should be at least 2 characters',
        lastNameLength: 'Last name should be at least 2 characters',
    },
    authenticationMessages: {
        missingAccount: `Oops, we couldn't find that account.`,
        badPassword: `Oops, your password was incorrect.`
    }
}
module.exports = {messages};
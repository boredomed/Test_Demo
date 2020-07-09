const mysql = require('../models/mysql');
const responseMessage = require('../library/response-messages');

module.exports = {
    getEmailAndUpdateCode,
    getHashAndUpdatePass,
    getName,
    changePas,

}

function changePas(userId, pass, salt) {
    return mysql.users.update(
        {
            password: pass,
            salt: salt
        },
        {
            where: {
                userId: userId
            }
        })
}


async function findHash(userId) {
    return mysql.users.findOne({
        where: {
            userId: userId
        },
        attributes: ['password', 'salt']
    });
}


async function getName(where) {
    const user = await mysql.users.findOne(where);
    if (user) {
        return user.get({plain: true});
    }
    return 0;
}

async function getEmailAndUpdateCode(where, val) {
    const user = await mysql.users.findOne(where);
    if (user) {
        return await user.update(val);
    }
    return 0;
}

async function getHashAndUpdatePass(where, val) {
    const user = await mysql.users.findOne(where);
    if (user) {
        return await user.update(val);
    }
    return 0;
}

const express = require('express');
const asyncHandler = require('express-async-handler')
const userCtrl = require('../controllers/users.controller');
const authHelper = require('../helpers/auth.helper');
const {jwtAuthHandler, localAuthHandler} = require('../middleware/auth-handler');
const session = require('../middleware/session');
const hasPermission = require('../middleware/permission.check');
const allowedSocial = ['facebook', 'linkedin', 'google'];
const responseMessages = require('../library/response-messages');
const notificationsHelper = require('../helpers/notifications.helper');
const router = express.Router();
module.exports = router;

router.post('/login', localAuthHandler, login);
router.post('/register', asyncHandler(register), login);
router.post('/register/:social', asyncHandler(registerSocial), login);
router.get('/me', jwtAuthHandler, asyncHandler(session), login);

async function login(req, res) {
    let user = req.user;
    delete user.password;
    let token = authHelper.generateToken(user);
    res.json({user, token});
}

async function registerSocial(req, res, next) {
    const social = req.params.social;
    if (!allowedSocial.includes(social.toLowerCase())) {
        res.status(422).send({
            code: 422,
            message: responseMessages.propertiesRequiredAllowed.replace('?', allowedSocial.join(','))
        });
    }
    const {token} = req.body;
    if (!token) {
        res.status(422).send({
            code: 422,
            message: responseMessages.propertiesRequiredMissing.replace('?', 'token')
        });
    }
    let user = await userCtrl.registerSocial(social, req.body);
    req.user = user;
    next()
}

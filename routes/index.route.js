const express = require('express');
const authRoutes = require('./auth.route');
const projRoutes = require('./project.route');
const userRoutes = require('./user.route');
const twilioRoutes = require('./twilio.route');
const pagination = require('../middleware/pagination');


const router = express.Router(); // eslint-disable-line new-cap

/** GET /health-check - Check service health */
router.get('/health-check', (req, res) =>
    res.send('OK')
);

router.use(pagination);
router.use('/auth', authRoutes);
router.use('/projects', projRoutes);
router.use('/user', userRoutes);
router.use('/twilio', twilioRoutes);


module.exports = router;

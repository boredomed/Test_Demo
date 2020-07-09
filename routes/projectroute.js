const express = require('express');
const projectCtrl = require('../controllers/projects.controller');
const {jwtAuthHandler} = require('../middleware/auth-handler');
const responseMessages = require('../library/response-messages');

const router = express.Router();
module.exports = router;

router.post('/', jwtAuthHandler, createProject);
router.post('/tagSearch', getProjectPhotoByTag);

router.route('/:projectId')
    .get(jwtAuthHandler, getProject)
    .put(jwtAuthHandler, updateProject)
    .delete(jwtAuthHandler, deleteProject);

router.route('/tag/:name')
    .get(jwtAuthHandler, typeAhead);

router.post('/getPhotos', jwtAuthHandler, getProjectPhotoByTag);

router.post('/review', jwtAuthHandler, postProjectReview);

async function createProject(req, res, next) {
    let userId = req.user.userId;
    let project = await projectCtrl.insert(req.body, userId);
    res.json({project});
}

async function getProject(req, res, next) {
    let projectId = req.params.projectId;
    let project = await projectCtrl.get(projectId, req.pagination);
    res.json({project})
}

async function getProjectPhotoByTag(req, res, next) {
    let tagProjectMedia = await projectCtrl.getByTag(req.body, req.pagination);
    res.json({tagProjectMedia});
}

async function deleteProject(req, res, next) {
    let projectId = req.params.projectId;
    let project = await projectCtrl.deleteProj(projectId);

    if (project) res.status(200).send({"code": 200, "message": responseMessages.recordDeleteSuccess})
    else res.status(400).send({"code": 400, "message": responseMessages.recordDeleteError})
}

async function updateProject(req, res, next) {
    let projectId = req.params.projectId;
    req.body.userId = req.user.userId;
    let project = await projectCtrl.update(projectId, req.body);

    if (project) res.status(200).send({"code": 200, "message": responseMessages.recordUpdateSuccess})
    else res.status(400).send({"code": 400, "message": responseMessages.recordUpdateError})
}

async function typeAhead(req, res, next) {
    const tags = await projectCtrl.getRec(req.params, req.pagination);

    if (tags) res.json({tags});
    else res.send({tags: []});
}

async function postProjectReview(req, res, next) {
    const review = await projectCtrl.postReview(req.body, req.user.userId);
    res.json({review});
}


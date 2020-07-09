const projectService = require('../services/project.service');
const locationService = require('../services/locations.service')

module.exports = {
    insert_1,
    get,
    deleteProj,
    update,
    getRec,
    getByTag,
    postReview
}

async function postReview(body, userId){
    body.reviewerId = userId;
    const pr = await projectService.addReview(body);
    return pr;
}

async function getByTag(tag, pagination){
    const pt = await projectService.getProjectPhoto(tag.tagId, pagination);

    let tagMedia = [];
    console.log(pt);
    if(pt.length !== 0) {
        const ptRaw = await pt[0].get({plain: true});
        for (item of ptRaw.tagsOfProject) {

            if (item.tagProjectLink && item.tagProjectLink.projectMedia) {
                for (let med of item.tagProjectLink.projectMedia) {
                    med.projectId = item.tagProjectLink.projectId;
                    med.projectTitle = item.tagProjectLink.title;
                    med.projectCreatedAT = item.tagProjectLink.createdAt;
                    tagMedia.push(med);
                }
            }
        }
    }

    return tagMedia;
}

async function insert (projects,userId) {
    const result = [];
        if (projects.data != null) {

            if (projects.data instanceof Array) {
                for (let proj of projects.data) {
                    result.push(await createProjectSingle(proj,userId));
                }
            } else {
                result.push(await createProjectSingle(projects,userId));
            }
        }
    else {

        if (projects instanceof Array) {
            for (let proj of projects) {
                result.push(await createProjectSingle(proj,userId));
            }
        } else {
            result.push(await createProjectSingle(projects,userId));
        }
    }
    return result;
}

async function get (projId,pagination) {
    const p = await projectService.findOneWhere({
            projectId: +projId
        },
        pagination
    );

    for(let i = 0; i <  p.projectTag.length; i++){
        p.projectTag[i] = p.projectTag[i].tagsP;

    }

    return p;
}

async function deleteProj (projId) {
    return projectService.deleteProject({
        where: {
            projectId: +projId
        }
    });
}

async function update (projId, proj) {

    if (proj.projectLocation) {
        proj.projectLocation = await locationService.addOrUpdateLocation(proj.projectLocation);
        proj.locationId  = proj.projectLocation.locationId;
    }
    proj.updatedAt = new Date();
    return projectService.updateProject(
        proj,
        +projId
    );
}
async function createTag(proj, projectId) {
//Iterating tags and adding in tags and project tags
    let tagArray = [];
    if (proj.tags) {
        for (let tag of proj.tags) {
            if (tag.tagId) {
                //insert in project_tags
                tag.projectId = projectId;
                tagArray.push(tag);
            } else {
                //find in tags
                const ft = await projectService.findTag(tag);
                if (ft) {
                    //insert in project tag
                    tag.tagId = ft.tagId;
                    tagArray.push(tag);
                    tag.projectId = projectId;
                } else {
                    //create in tag
                    const t = await projectService.createTag(tag);
                    //insert in project tag
                    tag.tagId = t.tagId;
                    tagArray.push(tag);
                    tag.projectId = projectId;
                }
            }
        }
    }
    await projectService.createProgTag(tagArray);
    return tagArray;
}

async function createProjectSingle(proj,userId) {
    if (proj.projectLocation) {
        proj.projectLocation = await locationService.addOrUpdateLocation(proj.projectLocation);
        proj.locationId = proj.projectLocation.locationId;
    }

    const p = await projectService.addProject(proj,userId);
    const location = await p.getProjectLocation();
    const pRaw = await p.get({plain: true});
    if(location !== null)
        pRaw.projectLocation = await location.get({plain: true});
    delete pRaw.locationId;

    const tagArray = await createTag(proj, pRaw.projectId);

    pRaw.tags = tagArray;
    return pRaw;
}

async function getRec(param, pagination){
    if(param.name === 'eyJhbGciOi'){
        const sampleTag = await projectService.getTags();
        return sampleTag;
    }

    if(param.name.length >= 3) {
        const t = await projectService.getRec(param,pagination);

        if(t.length) {
            return t;
        }
    }return 0;
}

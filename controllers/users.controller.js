const bcrypt = require('bcryptjs');
const userService = require('../services/user.service');
const userSocialService = require('../services/userSocial.service');
const authHelper = require('../helpers/auth.helper');
const socialHelper = require('../helpers/social.helper');
const linkedin = require('../config/linkedin');
const locationService = require('../services/locations.service')


module.exports = {
    insert,
    findAll,
    registerSocial,
    update,
    insertProfileView
}

async function insertProfileView(body , user){
    body.viewerId = user.userId;
    const ip = await userService.addProfileView(body);
    return ip;
}

async function insert (user) {
    user.salt = authHelper.generateRandomSalt();
    user.password = bcrypt.hashSync(user.password + user.salt, 10);

    if (!user.userName) {
        user.userName = `${(user.email.split('@')[0])}-${(Math.random().toString(36).substring(2, 10))}`;
    }

    if (user.userLocation) {
        user.userLocation = await locationService.addOrUpdateLocation(user.userLocation);
        user.locationId = user.userLocation.locationId;
    }

    if(!user.profileCompletedPercentage){
        user.profileCompletedPercentage = 0;
    }

    const u = await new userService.addUser(user);
    const uRaw = await u.get({plain: true});

    if(uRaw) {
        const g = await userService.getUserChanelId({"title": "email"});
        const gRaw = g.get({plain:true});
        if(gRaw){
            const t = await userService.addEmailInUserChannel(uRaw.userId,gRaw.channelTypeId, uRaw.email);
        }
    }

    delete uRaw.password;
    delete uRaw.salt;
    return uRaw;
}

async function findAll (user) {
    return userService.findAllWhere({
            where: {
                companyId: user.companyId
            },
            attributes: {
                exclude: ['password', 'salt']
            }
        }
    );
}


async function update(userId, userData){

    delete userData.password;
    delete userData.salt;
    delete userData.accessCode;
    delete userData.isActive;
    delete userData.roles;
    delete userData.blackListedBundles;
    userData.updatedAt = new Date();

    if (userData.userLocation) {
        userData.userLocation = await locationService.addOrUpdateLocation(userData.userLocation);
        userData.locationId = userData.userLocation.locationId;
    }
    return userService.update(userData,userId)
}

async function registerSocial (socialAppType, requestBody) {
    let userData;
    try {
        if (socialAppType === 'facebook') {
            userData = await socialHelper.readFromFacebook(requestBody.token);
        } else if (socialAppType === 'linkedin') {
            userData = await socialHelper.readFromLinedIn(requestBody.token,requestBody.redirectUrl?requestBody.redirectUrl:linkedin.linkedinRedirectUrl);
        } else if (socialAppType === 'google') {
            userData = await socialHelper.readFromGoogle(requestBody.token)
        }  else {
            throw new Error(`${(socialAppType)} not supported yet`);
        }
        // todo if email already exist
        let existsUser = await userService.findOneExists({email:userData.email});
        if(existsUser){
            const social = await userSocialService.findOneWhere({
                userId:existsUser.userId,
                social: socialAppType
            });
            if (!social){
                await userSocialService.addUserSocial({
                    userId:existsUser.userId,
                    social: socialAppType,
                    token:userData.socialId
                })
            }
            const uRaw = await existsUser.get({plain: true});
            delete uRaw.password;
            delete uRaw.salt;
            return uRaw;
        }

        const user = await insert(userData);
        // todo add social for user
        const social = await userSocialService.addUserSocial({
            userId:user.userId,
            social: socialAppType,
            token:userData.socialId
        });
        return user;
    } catch (err) {
        throw new Error('A social network account error has occurred: ' + err.message);
    }
}

wefuconst forgetPassService = require("../services/forgetPass.service.js");
const crypto = require('crypto');
const authHelper = require('../helpers/auth.helper');
const bcrypt = require('bcryptjs');
const responseMessage = require('../library/response-messages');
const axios = require('axios');
const env = require('../library/env');

env.required([
    'EMAIL_URL'
]);

module.exports = {
    sendToken,
    updatePass,
    changePass

}

async function sendToken(body){
    let val = Math.floor(1 + Math.random() * 9000).toString();

    let hash = crypto.createHash('md5').update(val).digest("hex")

    const p = await forgetPassService.getEmailAndUpdateCode({
            where: {
                email: body.email
            },
            attributes: {exclude: ['password', 'salt']}
        },
        {accessCode: hash}
    );

    if(p) {
        let name = p.firstName + " " + p.lastName;

        await axios.post(env.get('EMAIL_URL'), {
            "subject": "Recover Password",
            "body": {
                "template": "forgot-password",
                "context": {
                    "name": name,
                    "code": val
                }
            }
            ,
            "from": "masoodtalha7@gmail.com",
            "to": body.email
            })
            .catch(function (error) {
                console.log(error);
            });

        return 1;
    }
    else
        return 0;
}

async function updatePass(body){

        let hash = crypto.createHash('md5').update(body.accessCode.toString()).digest("hex");
        let salt = authHelper.generateRandomSalt();
        let password = bcrypt.hashSync(body.password + salt, 10);

        const p = await forgetPassService.getHashAndUpdatePass({
                where: {
                    accessCode: hash
                }
            },
            {
                salt: salt,
                password: password,
                confirmPassword: password
            }
        );
        if(p) return 1;
        else return 0;
}

async function changePass(body, userId){

    const hash = await forgetPassService.findHash(userId);
    let hash1 = hash.get({plain:true});
    let actualHash = hash1.password;

    if(await bcrypt.compareSync(body.currentPass + hash1.salt, actualHash)){
        let salt = authHelper.generateRandomSalt();
        let password = bcrypt.hashSync(body.newPass + salt, 10);
        let update = forgetPassService.changePas(userId, password, salt);
        return update;
    }else{
        return 0;
    }



}

const mysql = require('../models/mysql');

module.exports = {
    findAllPermissionForUserId
};


function findAllPermissionForUserId(userId) {
    return mysql.permissions.findAll({
        include: [{
            model: mysql.permissionsBundle,
            as: 'permissionsBundlePermissions',
            required: true,
            include: [{
                model: mysql.roles,
                as: "permissionsBundleRoles",
                required: true,
                include: [{
                    model: mysql.users,
                    as: "roleUsers",
                    where: {userId},
                    attributes: ['userId', 'email'],
                    required: true,
                }]
            }]
        }]
    });
}

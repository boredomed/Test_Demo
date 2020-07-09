const mysql = require('../models/mysql');

module.exports = {
    addLocation,
    addOrUpdateLocation
};

async function addLocation(location) {
    return mysql.locations.create(location);
}

async function addOrUpdateLocation(location) {
    if (location.locationId) { // update
        const loc = await mysql.locations.findByPk(location.locationId);
        if (loc !== null)
            return loc.update(location);
    }
    return mysql.locations.create(location);
}

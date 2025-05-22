// Database/services/index.js
const userService = require('./userService');
const libroService = require('./libroService');
const activityLogService = require('./activityLogService');
const tarjetaService = require('./tarjetaService');

module.exports = {
  userService,
  tarjetaService,
  libroService,
  activityLogService
};
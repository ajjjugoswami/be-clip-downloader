const cors = require("cors");
const config = require("../config");

function createCorsMiddleware() {
  return cors({ origin: config.cors.origins, methods: config.cors.methods });
}

module.exports = createCorsMiddleware;

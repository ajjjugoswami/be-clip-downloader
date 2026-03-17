const cors = require("cors");
const config = require("../config");

function createCorsMiddleware() {
  const origin =
    config.cors.origin === "*"
      ? true
      : config.cors.origin.split(",").map((s) => s.trim());

  return cors({ origin, methods: config.cors.methods });
}

module.exports = createCorsMiddleware;

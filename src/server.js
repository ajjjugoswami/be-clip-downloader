const app = require("./app");
const config = require("./config");
const logger = require("./utils/logger");

app.listen(config.port, () => {
  logger.info(`ClipStream backend running on port ${config.port} [${config.nodeEnv}]`);
});

const log4js = require("log4js");
const logger = require("./logger.js").access;
const DEFAULT_LOG_LEVEL = "auto";

module.exports = (opt) => {
  opt = opt || {};
  opt.level = opt.level || DEFAULT_LOG_LEVEL;
  return log4js.connectLogger(logger, opt);
}
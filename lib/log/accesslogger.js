const log4js = require("log4js");
const logger = require("./logger.js").access;
const DEFAULT_LOG_LEVEL = "auto";

module.exports = (opt) => {
  opt = opt || {};
  opt.level = opt.level || DEFAULT_LOG_LEVEL;
  opt.format = opt.format || function (req, res, format) {
    let address = req.headers["x-forwarded-for"] || req.ip;
    address = address.replace(/(\.|:)\d+(,|$)/g, "$10$2");
    return format(
      `${address}` +
      ":method " +
      ":url " +
      "HTTP/:http-version " +
      ":status " +
      ":response-time " +
      ":user-agent "
    );
  };
  return log4js.connectLogger(logger, opt);
}
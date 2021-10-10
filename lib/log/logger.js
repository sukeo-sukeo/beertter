const log4js = require("log4js");
const config = require("../../config/log4js.config");
let console, application, access;
// let application;

log4js.configure(config);

// Console logger.
// 引数なしでlog4js.config.jsの"default"を読み込む
console = log4js.getLogger();

// Application logger.
application = log4js.getLogger("application");

// Access logger.
access = log4js.getLogger("access");

module.exports = {
  console,
  application,
  access
}
require("dotenv").config();
const appconfig = require("./config/application.config.js");
const dbconfig = require("./config/mysql.config.js");
const path = require("path");
const logger = require("./lib/log/logger.js");
const applicationlogger = require("./lib/log/applicationlogger.js");
const accesslogger = require("./lib/log/accesslogger.js");
const accesscontrol = require("./lib/security/accesscontrol.js");
const express = require("express");
const favicon = require("serve-favicon");
const cookie = require("cookie-parser");
const session = require("express-session");
const MySQLStore = require("express-mysql-session")(session);
const flash = require("connect-flash");
const app = express();

// settings
app.set("view engine", "ejs");
app.disable("x-powered-by");

// global method to view engine.
app.use((req, res, next) => {
  res.locals.moment = require("moment");
  res.locals.padding = require("./lib/math/math.js").padding;
  next();
})

// static resource
app.use(favicon(path.join(__dirname, "./public/favicon.ico")));
app.use("/public", express.static(path.join(__dirname, "/public")));

// set access log.
app.use(accesslogger());

// set middleware
app.use(cookie());
app.use(session({
  store: new MySQLStore({
    host: dbconfig.HOST,
    port: dbconfig.PORT,
    user: dbconfig.USERNAME,
    password: dbconfig.PASSWORD,
    database: dbconfig.DATABASE,
  }),
  secret: appconfig.security.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  name: "sid"
}))
// formからのpostを読めるようにするミドルウェア
app.use(express.urlencoded({ extended: true }));
app.use(flash());
// accesscontrol側で配列を返し、それを展開して使う...
app.use(...accesscontrol.initialize());

// dynamic resource
app.use("/account", require("./routes/account.js"));
app.use("/search", require("./routes/search.js"));
app.use("/shops", require("./routes/shops.js"));
app.use("/", require("./routes/index.js"));

// set application log.
app.use(applicationlogger());
console.log(dbconfig);
// application 
app.listen(appconfig.PORT, () => {
  logger.application.info(`Application listening at ${appconfig.PORT}`);
})
require("dotenv").config();
const IS_PRODUCTION = process.env.NODE_ENV === "production";
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
const gracefulShutdown = require("http-graceful-shutdown");
const { resolve } = require("path");
const pool = require("./lib/database/pool.js");
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
  // httpsに限定するかどうか develop or product でflag管理
  cookie: {
    secure: IS_PRODUCTION
  },
  secret: appconfig.security.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  name: "sid"
}))
// formからのpostを読めるようにするミドルウェア
app.use(express.urlencoded({ extended: true }));
app.use(flash());
// accesscontrol側で配列を返し、それを展開して使う...
app.use(...accesscontrol.initialize());

// dynamic resource
app.use("/", (() => {
  const router = express.Router();
  // クリックジャッキング対策 iframe不可設定
  // routeing時に必ず下記headerを付加する記述
  router.use((req, res, next) => {
    res.setHeader("X-Frame-Options", "SAMEORIGIN");
    next();
  });
  router.use("/account", require("./routes/account.js"));
  router.use("/search", require("./routes/search.js"));
  router.use("/shops", require("./routes/shops.js"));
  // router.use("/test", (req, res) => {throw new Error("test error")});
  router.use("/", require("./routes/index.js"));
  return router;
 })());

// set application log.
app.use(applicationlogger());

// Custom Error page
app.use((req, res, next) => {
  res.status(404);
  res.render("./404.ejs");
});
app.use((err, req, res, next) => {
  res.status(500);
  res.render("./500.ejs");
});

// application 
let server = app.listen(appconfig.PORT, () => {
  logger.application.info(`Application listening at ${appconfig.PORT}`);
});

// Graceful shutdown
gracefulShutdown(server, {
  signals: "SIGINT SIGTERM",
  timeout: 10000,
  onShutdown: () => {
    return new Promise((resolve, reject) => {
      const { pool } = require("./lib/database/pool.js");
      pool.end(err => {
        if (err) {
          return reject(err);
        }
        resolve();
      })
    });
  },
  finally: () => {
    const logger = require("./lib/log/logger.js").application;
    logger.info("Application shutdown finished.")
  }
});
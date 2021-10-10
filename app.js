require("dotenv").config();
const PORT = process.env.PORT;
const path = require("path");
const logger = require("./lib/log/logger.js")
const applicationlogger = require("./lib/log/applicationlogger.js")
const accesslogger = require("./lib/log/accesslogger.js")
const express = require("express");
const favicon = require("serve-favicon");
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

// dynamic resource

app.use("/search", require("./routes/search.js"));
app.use("/shops", require("./routes/shops.js"));
app.use("/", require("./routes/index.js"));

// set application log.
app.use(applicationlogger());

// application 
app.listen(PORT, () => {
  logger.application.info(`Application listening at ${PORT}`);
})
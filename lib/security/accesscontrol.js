const passport = require("passport");

let initialize, authentiate, authorize;

initialize = function () {
  return [
    passport.initialize(),
    passport.session(),
    function (req, res, next) {
      if (req.user) {
        res.locals.user = req.user;
      }
      next();
    }
  ];
};

module.exports = {
  initialize,
  authentiate,
  authorize
};
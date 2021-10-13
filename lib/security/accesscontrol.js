const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const { MySQLClient, sql } = require("../database/client.js");
const PRIVILEGE = {
  NOMAL: "nomal"
} // 権限を定義 あるかないか

let initialize, authenticate, authorize;

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

// メイン部分
passport.use(
  "local-strategy",
  new LocalStrategy({
    usernameField: "username",
    passwordField: "password",
    passReqToCallback: true
  }, async (req, username, password, done) => {
      let results, user;
      try {
        results = await MySQLClient.executeQuery(
          await sql("SELECT_USER_BY_EMAIL"),
          [username]
        )
      } catch (err) {
        return done(err);
      }
      // login成否判定
      if (results.length === 1 &&
        password === results[0].password) {
        // 成功
        user = {
          id: results[0].id,
          name: results[0].name,
          email: results[0].email,
          permissions: [PRIVILEGE.NOMAL],
        };
        // session再発番 デバッグ方法 => devtoolでlogin前のsid, login後のsidを比べる
        req.session.regenerate(err => {
          if (err) {
            done(err);
          } else {
            done(null, user);
          }
        });
      } else {
        // 失敗
        done(null, false, req.flash("message", "ユーザー名 または パスワードが間違っています。"));
      }
  })
)


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

authenticate = function () {
  return passport.authenticate(
    "local-strategy",
    {
      successRedirect: "/account",
      failureRedirect: "/account/login"
    }
  )
}

module.exports = {
  initialize,
  authenticate,
  authorize,
  PRIVILEGE
};
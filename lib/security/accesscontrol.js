const {
  ACCOUNT_LOCK_WINDOW,
  ACCOUNT_LOCK_THRESHOLD,
  ACCOUNT_LOCK_TIME,
  MAX_LOGIN_HISTORY
} = require("../../config/application.config.js").security;
const bcrypt = require("bcrypt");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const { MySQLClient, sql } = require("../database/client.js");
const PRIVILEGE = {
  NOMAL: "nomal"
} // 権限を定義 あるかないか

const LOGIN_STATUS = {
  SUCCESS: 0,
  FAILURE: 1
};

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
    let now = new Date();
    try {
      // Get user info
      results = await MySQLClient.executeQuery(
        await sql("SELECT_USER_BY_EMAIL"),
        [username]
      );
      // 存在確認
      if (results.length !== 1) {
        return done(null, false, req.flash("message", "ユーザー名 または パスワードが間違っています。"))
      }

      // 存在したらuser情報を生成
      user = {
        id: results[0].id,
        name: results[0].name,
        email: results[0].email,
        permissions: [PRIVILEGE.NOMAL],
      };

      // delete old login log
      await MySQLClient.executeQuery(
        await sql("DELETE_LOGIN_HISTORY"),
        [user.id, user.id, MAX_LOGIN_HISTORY - 1] //mysqlが0スタートのため１ずらす
      );

      // passwordを比べてチェック
      // bycrpt導入前のif文 -> password === results[0].password
      if (!await bcrypt.compare(password, results[0].password)) {
        // Insert login log failure
        await MySQLClient.executeQuery(
          await sql("INSERT_LOGIN_HISTORY"),
          [user.id, now, LOGIN_STATUS.FAILURE]
        );

        return done(null, false, req.flash("message", "ユーザー名 または パスワードが間違っています。"))
      }

       // Insert login log success
        await MySQLClient.executeQuery(
          await sql("INSERT_LOGIN_HISTORY"),
          [user.id, now, LOGIN_STATUS.SUCCESS]
        );

    } catch (err) {
      return done(err);
    }

    // session再発番 デバッグ方法 => devtoolでlogin前のsid, login後のsidを比べる
    req.session.regenerate(err => {
      if (err) {
        done(err);
      } else {
        done(null, user);
      }
    });
      
  })
);


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

authorize = function (privilege) {
  return function (req, res, next) {
    // reqのisAuthenticatedというmethodを使い認可を確認
    // 認可があればpermissionsにprivilegeがあるか確認
    console.log(req.isAuthenticated());
    if (req.isAuthenticated() &&
      ((req.user.permissions || []).indexOf(privilege) >= 0)) {
      next();
    } else {
      res.redirect("/account/login");
    }
  };
}

module.exports = {
  initialize,
  authenticate,
  authorize,
  PRIVILEGE
};
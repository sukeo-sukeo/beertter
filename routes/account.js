const router = require("express").Router();
const { authenticate, authorize, PRIVILEGE } = require("../lib/security/accesscontrol.js");

router.get("/", authorize(PRIVILEGE.NOMAL), (req, res, next) => {
  res.render("./account/index.ejs");
});

// ログインに失敗したときにlogin.ejsにリダイレクト(connect-flashでmessageを添えて)
router.get("/login", (req, res, next) => {
  res.render("./account/login.ejs", { "message": req.flash("message") });
});

router.post("/login", authenticate());

router.post("/logout", (req, res, next) => {
  req.logOut();
  res.redirect("/account/login");
});

router.use("/reviews", authorize(PRIVILEGE.NOMAL), require("./account.reviews.js"));

module.exports = router;
const router = require("express").Router();
const { MySQLClient, sql } = require("../lib/database/client.js");
const moment = require("moment");
const tokens = new (require("csrf"));
const DATE_FORMAT = "YYYY/MM/DD";

let validateReviewData = function (req) {
  let body = req.body;
  let isValid = true, error = {};
  
  if (body.visit && !moment(body.visit, DATE_FORMAT).isValid()) {
    isValid = false;
    error.visit = "訪問日の日付文字列が不正です。";
  }

  if (isValid) {
    return undefined;
  }
  return error;

}

let createReviewData = function (req) {
  let body = req.body;
  return {
    shopId: req.params.shopId,
    score: parseFloat(body.score),
    visit: (date = moment(body.visit, DATE_FORMAT)) && date.isValid() ? date.toDate() : null,
    post: new Date(),
    description: body.description
  }
}

router.get("/regist/:shopId(\\d+)", async (req, res, next) => {
  let shopId = req.params.shopId;
  let secret, token, shop, shopName, review, results;

  secret = await tokens.secret(); //sessionに
  token = tokens.create(secret);  //cookieに
  req.session._csrf = secret;
  res.cookie("_csrf", token);

  try {
    results = await MySQLClient.executeQuery(
      await sql("SELECT_SHOP_BASIC_BY_ID"),
      [shopId]
    );
    shop = results[0] || {};
    shopName = shop.name;
    review = {};
    res.render("../views/account/reviews/regist-form.ejs", {shopId, shopName, review})
  } catch (err) {
    next(err);
  }
});

router.post("/regist/:shopId(\\d+)", (req, res, next) => {
  let review = createReviewData(req);
  let { shopId, shopName } = req.body;
  res.render("../views/account/reviews/regist-form.ejs", { shopId, shopName, review });
});

router.post("/regist/confirm", (req, res, next) => {
  let error = validateReviewData(req);
  let review = createReviewData(req);
  let { shopId, shopName } = req.body;

  if (error) {
    res.render("../views/account/reviews/regist-form.ejs", { error, shopId, shopName, review });
    return;
  }

  res.render("../views/account/reviews/regist-confirm.ejs", { shopId, shopName, review });
});

router.post("/regist/execute", async (req, res, next) => {
  let secret = req.session._csrf;
  let token = req.cookies._csrf;

  if (tokens.verify(secret, token) === false) {
    next(new Error("Invalid Token."));
    return;
  }

  let error = validateReviewData(req);
  let review = createReviewData(req);
  let { shopId, shopName } = req.body;
  let userId = 1;  // todo: ログイン機能実装後に更新
  let transaction;

  if (error) {
    res.render("../views/account/reviews/regist-form.ejs", { error, shopId, shopName, review });
    return;
  }

  try {
    transaction = await MySQLClient.beginTransaction();
    transaction.executeQuery(
      await sql("SELECT_SHOP_BY_ID_FOR_UPDATE"),
      [shopId]
    );
    transaction.executeQuery(
      await sql("INSERT_SHOP_REVIEW"),
      [shopId, userId, review.score, review.visit, review.description]
    );
    transaction.executeQuery(
      await sql("UPDATE_SHOP_SCORE_BY_ID"),
      [shopId, shopId]
    )
    await transaction.commit();
  } catch (err) {
    await transaction.rollback();
    next(err);
    return
  }
  
  delete req.session._csrf;
  res.clearCookie("_csrf");
  
  res.redirect(`/account/reviews/regist/complete?shopId=${shopId}`);
})

router.get("/regist/complete", (req, res, next) => {
  res.render("../views/account/reviews/regist-complete.ejs", {
    shopId: req.query.shopId,
  });
});
module.exports = router;
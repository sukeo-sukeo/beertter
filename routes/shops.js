const router = require("express").Router();
const {MySQLClient, sql} = require("../lib/database/client.js");

router.get("/:id", async (req, res, next) => {
  let id = req.params.id;
  // のちのち各種情報をテーブルからとってくるのでpromise.allを使う.
  Promise.all([
    MySQLClient.executeQuery(
      await sql("SELECT_SHOP_DETAIL_BY_ID"), [id]),
    MySQLClient.executeQuery(
      await sql("SELECT_SHOP_REVIEW_BY_SHOP_ID"), [id]),
  ]).then(results => {
    let data = results[0][0];
    // || []; をつけることで配列を保証する.dataがとれなかった場合を想定.
    data.reviews = results[1] || [];
    res.render("../views/shops/index.ejs", data);
  }).catch(err => {
    next(err);
  })
});

module.exports = router;
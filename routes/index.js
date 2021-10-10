const router = require("express").Router();

router.get("/", (req, res) => {
  // viewsからの相対pathとなる
  res.render("./index.ejs");
})

module.exports = router;
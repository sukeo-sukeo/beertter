module.exports = {
  PORT: process.env.PORT || 3000,
  security: {
    SESSION_SECRET: "I-LIKE-BEER-VERY-MUCH",
    ACCOUNT_LOCK_WINDOW: 30,
    ACCOUNT_LOCK_THRESHOLD: 5,
    ACCOUNT_LOCK_TIME: 60,
    MAX_LOGIN_HISTORY: 20, //履歴の保持数
  },
  search: {
    MAX_ITEMS_PER_PAGE: 5
  }
}
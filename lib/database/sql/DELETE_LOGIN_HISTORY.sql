-- ②①よりも古い履歴を消してください
DELETE FROM
  t_login_history
WHERE
  user_id = ?
  AND
  login <=

(
-- select後のdeleteは出来ない仕様のため(AS hoge)別名にして再度取得の形をとる
  SELECT
    login
  FROM
  (
-- ①ログイン履歴を取得
    SELECT
      login
    FROM
      t_login_history
    WHERE
      user_id = ?
    ORDER BY login DESC 
    LIMIT 1 OFFSET ?
  ) AS tmp
)
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const fs = require("fs");
const { parse } = require("csv-parse/sync");
const { stringify } = require("csv-stringify/sync");

const flag = "Q1RG8J+aqeOBq+aFo+OCjOOBpuOBhOOBvuOBmeOBrQ==";

const parseCSV = (filePath) => {
  const inputData = fs.readFileSync(filePath, { encoding: "utf8" });
  const parsedData = parse(inputData, { columns: true });
  return parsedData;
};

const sanitize = (str) => {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
};

const answerTable = () => {
  const parsedData = parseCSV("./answerer.csv");
  let insertRow = "";
  for (let i = 0; i < parsedData.length; i++) {
    const element = parsedData[i];
    insertRow += `<tr> <th>${sanitize(element["date"])}</th> <th>${sanitize(
      element["nickname"]
    )}</th></tr>`;
  }
  return `
    <table style="text-align:left" border="1">
    <tr>
     <th>日時</th> <th>ニックネーム</th>
    </tr>
    ${insertRow}
    </table>
    `;
};

const messageTable = () => {
  const parsedData = parseCSV("./message.csv");
  let insertRow = `<title>みんなの掲示板</title>
    <p><h1>みんなの掲示板</h1>仲良くしましょう！</p>
    <p><a href="/">投稿ページに戻る</a></p>
    <hr>`;
  for (let i = parsedData.length - 1; i >= 0; i--) {
    const element = parsedData[i];
    insertRow += `
            <div>
            <!-- ${element["user-agent"]} -->
            <p><b>${sanitize(element["handlename"])}</b>  ${sanitize(
      element["date"]
    )}</p>
            <p><i>${sanitize(element["message"])}</p></i>
            </div>
            <hr>
        `;
  }
  return `
    ${insertRow}
    `;
};

app.use(bodyParser.urlencoded({ extended: false }));

app.get("/", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
    <meta http-equiv="content-language" content="ja">
    <meta charset="UTF-8">
    <title>CTF</title>
    </head>
    <body>
    <p>このWebサイトの「ある脆弱性」を攻撃しようとしてみてください。</p>
    <p>するとフラグ(flag{XXX}の形式になっており、XXXの部分)が現れます!</p>
    <p><a href="/send-flag">フラグを送信する</a></p>

    <h4>注意事項</h4>
    <li>サーバに負荷をかける行為は禁止です｡</li>
    <li>実際の脆弱性は発生しないように作ったつもりです。
    <li>もし実際の脆弱性が発生したら@TakuKitamuraまでこっそりお伝え下さい！
    </form>
    <hr/>
    <form action="/send-message" method="post">
    <div>
        <h1><a href="/check-message">みんなの掲示板</a></h1>
        <p>ハンドルネーム(10文字まで): <input type="text" name="handlename" size="20" maxlength="10" /></p>
        <p>メッセージ(30文字まで): <input type="text" name="message" size="60" maxlength="30" /></p>
        <input type="submit" value="送信" />
        <p><b>※ CTF参加者全員が送信内容を確認できます。</b></p>
    </div>
    <hr/>
    <h4>正解者</h4>
    ${answerTable()}
    </body>
    </html>
    `);
});

app.get("/send-flag", (req, res) => {
  res.send(`<form action="/check-flag" method="post">
    <p>
        FLAG: <input type="text" name="flag" placeholder="ここにFLAGを入力してください" size="50" />
        <input type="submit" value="送信" />
    </p>`);
});

app.get("/check-answerer", (req, res) => {
  res.send(`<h4>正解者</h4>${answerTable()}`);
});

app.get("/check-message", (req, res) => {
  res.send(`${messageTable()}`);
});

app.post("/send-message", (req, res) => {
  let handlename = req.body.handlename.slice(0, 10) || "名無し";
  let message = req.body.message.slice(0, 30) || "(空メッセージ)";

  const userAgent = req.get("User-Agent");
  if (userAgent.indexOf("-->") !== -1) {
    const flagMessage = `flag{${flag}}`;
    res.send(
      `<script>alert('XSS!');document.write('${flagMessage}')</script>`
    );
    return;
  }

  const parsedData = parseCSV("./message.csv");
  parsedData.push({
    handlename: handlename,
    message: message,
    "user-agent": userAgent.slice(0, 150),
    date: new Date().toLocaleString("ja-JP", {
      timeZone: "Asia/Tokyo",
    }),
  });
  const outputData = stringify(parsedData, { header: true });
  fs.writeFileSync("message.csv", outputData, { encoding: "utf8" });

  res.redirect("/check-message");
});

app.post("/check-flag", (req, res) => {
  if (req.body.flag !== flag) {
    res.send('FLAGが誤っています｡<br> <a href="/">戻る</a>');
    return;
  }
  res.send(`
    <h1>正解です!</h1>
    <p>よかったら、ニックネーム(10文字以内)を記入し送信してください。</p>
    <p>何もニックネームを入力せず登録した場合「名無し」で登録されます。</p>
    <p>正解者の二重投稿は遠慮してください。</p>
    <form action="/welcome-to-ctf" method="post">
    <p>ニックネーム: <input type="text" name="nickname" size="20" maxlength="10" />
    </p>
    <p><input type="submit" value="記録して戻る" /></p>
    `);
});

app.post("/welcome-to-ctf", (req, res) => {
  const parsedData = parseCSV("./answerer.csv");
  let nickname = req.body.nickname.slice(0, 10);
  if (nickname.length === 0) {
    nickname = "名無し";
  }
  parsedData.push({
    nickname: nickname,
    date: new Date().toLocaleString("ja-JP", {
      timeZone: "Asia/Tokyo",
    }),
  });
  const outputData = stringify(parsedData, { header: true });
  fs.writeFileSync("answerer.csv", outputData, { encoding: "utf8" });

  res.redirect("/");
});

app.listen(3000, "localhost", () => {
  console.log("Access http://localhost:3000");
});

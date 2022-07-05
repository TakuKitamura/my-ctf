# MyCTF

## Problem1

### 依存関係
- node(v16.5.1 LTS)
- npm(v?)

### CTF問題の起動
```bash
$ git clone https://github.com/TakuKitamura/my-ctf.git
$ cd my-ctf/problem1
$ npm install
$ npm run start
Access http://localhost:3000
```

### 回答
Google ChromeやFirefoxなどのデベロッパーツールを利用し、User-Agentを以下の値に設定し、メッセージを投稿する。

`--> <img src="x" onerror="alert()" />`

### 想定していた回答導出までの流れ
1. ハンドルネーム、メッセージに適当なXSSパターンを入力し、送信する。
1. メッセージが出力される http://localhost:3000/check-message のHTMLをデベロッパーツールで確認する。
1. ハンドルネーム、メッセージがサニタイジングされていることがわかる。
1. 他の脆弱性の可能性を検討するため、デベロッパーツールでHTMLを眺めていると、ハンドルネームの要素を囲ったpタグの上に、
`<!-- Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.0.0 Safari/537.36 -->`
というコメントがあることに気づく。
1. このWebサイトの開発者はUser-Agentは任意に書き換えられることを知らないという可能性を考える。
1. User-Agentに`AAA`のような適当な文字列を設定した上で、メッセージを投稿する。
1. すると、HTML上の文字列も`AAA`に変わっていることに気づく。
1. コメントを途中で区切るような、User-Agentを設定してみる。
1. フラグが出力される。

### 応用問題
このCTFのフラグ出力機能をバイパス可能なXSS脆弱性がある。
つまり、実際のXSSを起こしてしまうパターン(私実装&設計のミスです)がある。
それを見つけてみよう。

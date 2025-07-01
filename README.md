# TikTokコメント管理ツール

TikTokの投稿に対するコメントを管理するためのWebツールです。Googleスプレッドシートと連携して、未対応のコメントを投稿者ごとに表示し、対応済みマークを付けることができます。

## デモ

[ここにGitHub PagesのURLが入ります]

## 機能

- 📋 Googleスプレッドシートからコメントデータを自動取得
- 👥 投稿者ごとにコメントをグループ化表示
- 📱 未対応コメント（ステータスが空）のみを表示
- 📋 ワンクリックでコメントをコピー
- ✅ 完了ボタンでスプレッドシートに自動記録

## セットアップ

### 1. リポジトリをフォーク

このリポジトリをフォークして、自分のGitHubアカウントにコピーしてください。

### 2. 設定ファイルの作成

1. `config.example.js`を`config.js`としてコピー
2. 以下の情報を設定：
   - `API_KEY`: Google Sheets APIキー
   - `SCRIPT_URL`: Google Apps ScriptのWebアプリURL
   - `SPREADSHEET_ID`: 使用するスプレッドシートのID

### 3. Google Sheets API キーの取得

1. [Google Cloud Console](https://console.cloud.google.com/)にアクセス
2. 新しいプロジェクトを作成
3. Google Sheets APIを有効化
4. APIキーを作成
5. 作成したAPIキーを`config.js`に設定

### 4. Google Apps Scriptの設定

1. [Google Apps Script](https://script.google.com/)で新規プロジェクト作成
2. `google-apps-script.gs`の内容をコピー＆ペースト
3. ウェブアプリとしてデプロイ
   - 実行ユーザー：自分
   - アクセスできるユーザー：全員
4. 発行されたURLを`config.js`に設定

### 5. GitHub Pagesで公開

1. リポジトリの設定 → Pages
2. Source: Deploy from a branch
3. Branch: main / root
4. Save

数分後、`https://[あなたのユーザー名].github.io/[リポジトリ名]/`でアクセス可能になります。

## 使い方

1. ブラウザでサイトにアクセス
2. 自動的に未対応コメントが表示されます
3. 各コメントに対して：
   - 「コピー」ボタン：コメント内容をクリップボードにコピー
   - 「完了」ボタン：スプレッドシートのH列に○を記入

## スプレッドシートの形式

以下の列構成である必要があります：

| 列 | 内容 |
|---|---|
| A | 投稿ID |
| B | 日付 |
| C | 投稿URL |
| D | グループ |
| E | 投稿者名 |
| F | コメント内容 |
| G | Slack通知 |
| H | ステータス（○で完了） |

## トラブルシューティング

### データが表示されない
- APIキーが正しく設定されているか確認
- スプレッドシートの共有設定を確認
- ブラウザの開発者ツールでエラーを確認

### 完了ボタンが動作しない
- Google Apps ScriptのURLが正しいか確認
- スプレッドシートの編集権限を確認

## ライセンス

MIT License

## 作者

[あなたの名前]
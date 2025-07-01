# Netlifyセットアップガイド

## 1. GitHubリポジトリをプライベートに変更

1. https://github.com/tedtomo/tiktok-comment-manager/settings にアクセス
2. 「Danger Zone」セクションの「Change visibility」をクリック
3. 「Make private」を選択
4. リポジトリ名を入力して確認

## 2. Netlifyアカウント作成

1. [Netlify](https://www.netlify.com/)にアクセス
2. 「Sign up」→「GitHub」でサインアップ

## 3. 新しいサイトをデプロイ

1. Netlifyダッシュボードで「Add new site」→「Import an existing project」
2. 「GitHub」を選択
3. プライベートリポジトリ「tiktok-comment-manager」を選択
4. デプロイ設定はそのまま（自動で検出される）
5. 「Deploy site」をクリック

## 4. 環境変数の設定

1. Netlifyのサイト設定画面で「Site settings」→「Environment variables」
2. 以下の2つの環境変数を追加：

   - **Key**: `GOOGLE_SHEETS_API_KEY`
   - **Value**: あなたのGoogle Sheets APIキー

   - **Key**: `GOOGLE_APPS_SCRIPT_URL`
   - **Value**: あなたのGoogle Apps Script URL

3. 「Save」をクリック

## 5. 再デプロイ

1. 「Deploys」タブに移動
2. 「Trigger deploy」→「Deploy site」をクリック
3. デプロイが完了するまで待つ（1-2分）

## 6. サイトにアクセス

1. Netlifyが提供するURL（例：`https://amazing-site-123.netlify.app/`）でアクセス
2. カスタムドメインも設定可能

## メリット

- APIキーがソースコードに含まれない（安全）
- プライベートリポジトリからデプロイ可能
- 自動デプロイ（GitHubにpushすると自動更新）
- 完全無料
- HTTPS対応

## トラブルシューティング

### ビルドエラーが発生する場合
- 環境変数が正しく設定されているか確認
- Netlifyのビルドログを確認

### データが表示されない場合
- APIキーが正しいか確認
- Google Apps Script URLが正しいか確認
- ブラウザの開発者ツールでエラーを確認
// Netlifyビルド時に環境変数を置換するスクリプト
const fs = require('fs');

const config = `// Netlifyの環境変数から設定を読み込む
const CONFIG = {
    API_KEY: '${process.env.GOOGLE_SHEETS_API_KEY || ''}',
    SCRIPT_URL: '${process.env.GOOGLE_APPS_SCRIPT_URL || ''}',
    SPREADSHEET_ID: '1J91iQTAn1mBImk14zqK9MApEuaQ0exwTHfcujuaOAtI'
};`;

fs.writeFileSync('netlify-config.js', config);
console.log('Config file generated successfully!');
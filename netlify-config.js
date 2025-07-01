// Netlifyの環境変数から設定を読み込む
const CONFIG = {
    // Netlifyの環境変数から読み込み（ビルド時に置換される）
    API_KEY: process.env.GOOGLE_SHEETS_API_KEY || '',
    SCRIPT_URL: process.env.GOOGLE_APPS_SCRIPT_URL || '',
    SPREADSHEET_ID: '1J91iQTAn1mBImk14zqK9MApEuaQ0exwTHfcujuaOAtI'
};
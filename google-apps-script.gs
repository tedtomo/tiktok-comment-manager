// Google Apps Script (スプレッドシート更新用)
// このコードはGoogle Apps Scriptエディタに貼り付けて使用してください

function doPost(e) {
  try {
    // リクエストのデータを取得
    const data = JSON.parse(e.postData.contents);
    const row = data.row;
    const column = data.column;
    const value = data.value;
    
    // スプレッドシートを開く
    const spreadsheet = SpreadsheetApp.openById('1J91iQTAn1mBImk14zqK9MApEuaQ0exwTHfcujuaOAtI');
    const sheet = spreadsheet.getSheetByName('シート1');
    
    // 指定されたセルに値を設定
    sheet.getRange(row, column).setValue(value);
    
    // 成功レスポンスを返す
    return ContentService
      .createTextOutput(JSON.stringify({status: 'success'}))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    // エラーレスポンスを返す
    return ContentService
      .createTextOutput(JSON.stringify({status: 'error', message: error.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// GET リクエスト用（テスト用）
function doGet(e) {
  return ContentService
    .createTextOutput('Google Apps Script is working!')
    .setMimeType(ContentService.MimeType.TEXT);
}
// Google Sheets設定
const SPREADSHEET_ID = typeof CONFIG !== 'undefined' ? CONFIG.SPREADSHEET_ID : '1J91iQTAn1mBImk14zqK9MApEuaQ0exwTHfcujuaOAtI';
const API_KEY = typeof CONFIG !== 'undefined' ? CONFIG.API_KEY : '';
const SHEET_NAME = 'シート1';
const RANGE = 'A:H';

// データを取得する関数
async function fetchSheetData() {
    try {
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${SHEET_NAME}!${RANGE}?key=${API_KEY}`;
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error('データの取得に失敗しました');
        }
        
        const data = await response.json();
        return data.values || [];
    } catch (error) {
        console.error('Error:', error);
        showError('データの取得に失敗しました。APIキーを設定してください。');
        return [];
    }
}

// 未実行のコメントをフィルタリングする関数
function filterPendingComments(data) {
    const headers = data[0];
    const rows = data.slice(1);
    
    const pendingComments = [];
    
    rows.forEach((row, index) => {
        // A列（投稿ID）が存在し、H列（ステータス）が空の場合
        if (row[0] && !row[7]) {
            pendingComments.push({
                rowIndex: index + 2, // スプレッドシートの行番号（ヘッダー行を考慮）
                postId: row[0],
                date: row[1],
                url: row[2],
                group: row[3],
                posterName: row[4],
                comment: row[5],
                slackNotification: row[6]
            });
        }
    });
    
    return pendingComments;
}

// 投稿者ごとにグループ化する関数
function groupByPoster(comments) {
    const grouped = {};
    
    comments.forEach(comment => {
        if (!grouped[comment.posterName]) {
            grouped[comment.posterName] = [];
        }
        grouped[comment.posterName].push(comment);
    });
    
    return grouped;
}

// HTMLを生成する関数
function generateHTML(groupedComments) {
    const contentDiv = document.getElementById('content');
    contentDiv.innerHTML = '';
    
    if (Object.keys(groupedComments).length === 0) {
        contentDiv.innerHTML = '<div class="no-comments">未実行のコメントはありません</div>';
        return;
    }
    
    Object.entries(groupedComments).forEach(([posterName, comments]) => {
        const posterSection = document.createElement('div');
        posterSection.className = 'poster-section';
        
        const posterNameDiv = document.createElement('div');
        posterNameDiv.className = 'poster-name';
        posterNameDiv.textContent = posterName;
        posterSection.appendChild(posterNameDiv);
        
        comments.forEach(comment => {
            const commentItem = document.createElement('div');
            commentItem.className = 'comment-item';
            
            const commentHeader = document.createElement('div');
            commentHeader.className = 'comment-header';
            
            const dateSpan = document.createElement('span');
            dateSpan.className = 'comment-date';
            dateSpan.textContent = comment.date;
            
            const urlLink = document.createElement('a');
            urlLink.className = 'comment-url';
            urlLink.href = comment.url;
            urlLink.target = '_blank';
            urlLink.textContent = 'TikTok投稿を見る';
            
            commentHeader.appendChild(dateSpan);
            commentHeader.appendChild(urlLink);
            
            const commentContent = document.createElement('div');
            commentContent.className = 'comment-content';
            commentContent.textContent = comment.comment;
            
            const buttonGroup = document.createElement('div');
            buttonGroup.className = 'button-group';
            
            const copyBtn = document.createElement('button');
            copyBtn.className = 'copy-btn';
            copyBtn.textContent = 'コピー';
            copyBtn.onclick = () => copyComment(comment.comment, copyBtn);
            
            const completeBtn = document.createElement('button');
            completeBtn.className = 'complete-btn';
            completeBtn.textContent = '完了';
            completeBtn.onclick = () => markAsComplete(comment.rowIndex, completeBtn);
            
            buttonGroup.appendChild(copyBtn);
            buttonGroup.appendChild(completeBtn);
            
            commentItem.appendChild(commentHeader);
            commentItem.appendChild(commentContent);
            commentItem.appendChild(buttonGroup);
            
            posterSection.appendChild(commentItem);
        });
        
        contentDiv.appendChild(posterSection);
    });
}

// コメントをコピーする関数
async function copyComment(comment, button) {
    try {
        await navigator.clipboard.writeText(comment);
        const originalText = button.textContent;
        button.textContent = 'コピーしました！';
        button.style.background = '#5cb85c';
        
        setTimeout(() => {
            button.textContent = originalText;
            button.style.background = '#17a2b8';
        }, 2000);
    } catch (err) {
        console.error('コピーに失敗しました:', err);
        alert('コピーに失敗しました');
    }
}

// 完了状態に更新する関数
async function markAsComplete(rowIndex, button) {
    button.disabled = true;
    button.textContent = '更新中...';
    
    try {
        // Google Apps Script Web Appを使用してスプレッドシートを更新
        const scriptUrl = typeof CONFIG !== 'undefined' ? CONFIG.SCRIPT_URL : '';
        
        const response = await fetch(scriptUrl, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                row: rowIndex,
                column: 8, // H列
                value: '○'
            })
        });
        
        showSuccessMessage();
        button.textContent = '完了済み';
        button.style.background = '#6c757d';
        
        // 3秒後に画面を更新
        setTimeout(() => {
            loadData();
        }, 3000);
        
    } catch (error) {
        console.error('Error:', error);
        button.disabled = false;
        button.textContent = '完了';
        alert('更新に失敗しました。Google Apps Scriptの設定を確認してください。');
    }
}

// 成功メッセージを表示する関数
function showSuccessMessage() {
    const successMessage = document.getElementById('successMessage');
    successMessage.style.display = 'block';
    
    setTimeout(() => {
        successMessage.style.display = 'none';
    }, 3000);
}

// エラーメッセージを表示する関数
function showError(message) {
    const errorDiv = document.getElementById('error');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    document.getElementById('loading').style.display = 'none';
}

// データを読み込む関数
async function loadData() {
    document.getElementById('loading').style.display = 'block';
    document.getElementById('content').style.display = 'none';
    document.getElementById('error').style.display = 'none';
    
    const data = await fetchSheetData();
    
    if (data.length > 0) {
        const pendingComments = filterPendingComments(data);
        const groupedComments = groupByPoster(pendingComments);
        generateHTML(groupedComments);
        
        document.getElementById('loading').style.display = 'none';
        document.getElementById('content').style.display = 'block';
    } else {
        document.getElementById('loading').style.display = 'none';
    }
}

// ページ読み込み時にデータを取得
document.addEventListener('DOMContentLoaded', loadData);
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
        showError('データの取得に失敗しました。ページを再読み込みしてください。');
        return [];
    }
}

// 未実行のコメントをフィルタリングする関数
function filterPendingComments(data) {
    const headers = data[0];
    const rows = data.slice(1);
    
    const pendingComments = [];
    const today = new Date().toLocaleDateString('ja-JP');
    
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
                slackNotification: row[6],
                isToday: row[1] === today
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

// 統計情報を更新する関数
function updateStats(comments) {
    const totalComments = comments.length;
    const posters = new Set(comments.map(c => c.posterName));
    const totalPosters = posters.size;
    const todayComments = comments.filter(c => c.isToday).length;
    
    document.getElementById('totalComments').textContent = totalComments;
    document.getElementById('totalPosters').textContent = totalPosters;
    document.getElementById('todayComments').textContent = todayComments;
    
    if (totalComments > 0) {
        document.getElementById('stats').style.display = 'flex';
    }
}

// HTMLを生成する関数
function generateHTML(groupedComments) {
    const contentDiv = document.getElementById('content');
    contentDiv.innerHTML = '';
    
    if (Object.keys(groupedComments).length === 0) {
        contentDiv.innerHTML = `
            <div class="no-comments">
                <div class="no-comments-icon">🎉</div>
                <div class="no-comments-text">未対応のコメントはありません</div>
            </div>
        `;
        return;
    }
    
    Object.entries(groupedComments).forEach(([posterName, comments]) => {
        const posterSection = document.createElement('div');
        posterSection.className = 'poster-section';
        posterSection.setAttribute('data-poster', posterName);
        
        const posterHeader = document.createElement('div');
        posterHeader.className = 'poster-header';
        posterHeader.innerHTML = `
            <span>${posterName}</span>
            <span class="comment-count">${comments.length}件</span>
        `;
        posterSection.appendChild(posterHeader);
        
        const commentsContainer = document.createElement('div');
        commentsContainer.className = 'comments-container';
        
        comments.forEach((comment, index) => {
            const commentItem = document.createElement('div');
            commentItem.className = 'comment-item';
            commentItem.setAttribute('data-row', comment.rowIndex);
            
            const commentHeader = document.createElement('div');
            commentHeader.className = 'comment-header';
            
            const dateSpan = document.createElement('span');
            dateSpan.className = 'comment-date';
            dateSpan.textContent = comment.date;
            if (comment.isToday) {
                dateSpan.style.color = '#26de81';
                dateSpan.style.fontWeight = 'bold';
            }
            
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
            copyBtn.innerHTML = 'コピー';
            copyBtn.onclick = () => copyComment(comment.comment, copyBtn);
            
            const completeBtn = document.createElement('button');
            completeBtn.className = 'complete-btn';
            completeBtn.innerHTML = '完了';
            completeBtn.onclick = () => markAsComplete(comment.rowIndex, completeBtn, commentItem);
            
            buttonGroup.appendChild(copyBtn);
            buttonGroup.appendChild(completeBtn);
            
            commentItem.appendChild(commentHeader);
            commentItem.appendChild(commentContent);
            commentItem.appendChild(buttonGroup);
            
            commentsContainer.appendChild(commentItem);
        });
        
        posterSection.appendChild(commentsContainer);
        contentDiv.appendChild(posterSection);
    });
}

// コメントをコピーする関数
async function copyComment(comment, button) {
    try {
        await navigator.clipboard.writeText(comment);
        const originalHTML = button.innerHTML;
        button.innerHTML = 'コピーしました！';
        button.style.background = '#5cb85c';
        
        setTimeout(() => {
            button.innerHTML = originalHTML;
            button.style.background = '#17c0eb';
        }, 2000);
    } catch (err) {
        console.error('コピーに失敗しました:', err);
        alert('コピーに失敗しました');
    }
}

// 完了状態に更新する関数
async function markAsComplete(rowIndex, button, commentItem) {
    button.disabled = true;
    button.innerHTML = '更新中...';
    
    try {
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
        
        // no-corsモードでは実際のレスポンスは取得できないため、成功と仮定
        showSuccessMessage();
        button.innerHTML = '完了済み';
        button.style.background = '#95a5a6';
        
        // アニメーションで非表示
        commentItem.style.transition = 'all 0.5s ease';
        commentItem.style.opacity = '0.5';
        commentItem.style.transform = 'scale(0.95)';
        
        // ポスターセクションのコメント数を更新
        const posterSection = commentItem.closest('.poster-section');
        const remainingComments = posterSection.querySelectorAll('.comment-item:not([style*="opacity"])').length - 1;
        
        if (remainingComments === 0) {
            setTimeout(() => {
                posterSection.style.transition = 'all 0.5s ease';
                posterSection.style.opacity = '0';
                posterSection.style.transform = 'scale(0.9)';
                setTimeout(() => {
                    posterSection.remove();
                    checkIfEmpty();
                }, 500);
            }, 500);
        }
        
        // 統計を更新
        updateStatsAfterComplete();
        
    } catch (error) {
        console.error('Error:', error);
        button.disabled = false;
        button.innerHTML = '完了';
        alert('更新に失敗しました。ページを再読み込みしてください。');
    }
}

// 完了後の統計更新
function updateStatsAfterComplete() {
    const totalElement = document.getElementById('totalComments');
    const current = parseInt(totalElement.textContent);
    if (current > 0) {
        totalElement.textContent = current - 1;
    }
}

// 空になったかチェック
function checkIfEmpty() {
    const sections = document.querySelectorAll('.poster-section');
    const visibleSections = Array.from(sections).filter(s => s.style.opacity !== '0');
    
    if (visibleSections.length === 0) {
        document.getElementById('content').innerHTML = `
            <div class="no-comments">
                <div class="no-comments-icon">🎉</div>
                <div class="no-comments-text">すべて完了しました！</div>
            </div>
        `;
        document.getElementById('stats').style.display = 'none';
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
    document.getElementById('stats').style.display = 'none';
    
    const data = await fetchSheetData();
    
    if (data.length > 0) {
        const pendingComments = filterPendingComments(data);
        updateStats(pendingComments);
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
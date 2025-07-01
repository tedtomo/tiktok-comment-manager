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
        document.getElementById('stats').style.display = 'grid';
    }
}

// HTMLを生成する関数
function generateHTML(groupedComments) {
    const contentDiv = document.getElementById('content');
    contentDiv.innerHTML = '';
    
    if (Object.keys(groupedComments).length === 0) {
        contentDiv.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">✅</div>
                <div class="empty-text">すべて完了しました</div>
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
            <span class="poster-name">${posterName}</span>
            <span class="comment-count">${comments.length}件</span>
        `;
        posterSection.appendChild(posterHeader);
        
        const commentsContainer = document.createElement('div');
        commentsContainer.className = 'comments-container';
        
        comments.forEach((comment, index) => {
            const commentItem = document.createElement('div');
            commentItem.className = 'comment-item';
            commentItem.setAttribute('data-row', comment.rowIndex);
            
            const commentMeta = document.createElement('div');
            commentMeta.className = 'comment-meta';
            
            const dateSpan = document.createElement('span');
            dateSpan.className = 'comment-date';
            dateSpan.textContent = comment.date;
            if (comment.isToday) {
                dateSpan.style.color = 'var(--success)';
            }
            
            const urlLink = document.createElement('a');
            urlLink.className = 'comment-link';
            urlLink.href = comment.url;
            urlLink.target = '_blank';
            urlLink.textContent = 'TikTokで見る →';
            
            commentMeta.appendChild(dateSpan);
            commentMeta.appendChild(urlLink);
            
            const commentContent = document.createElement('div');
            commentContent.className = 'comment-content';
            commentContent.textContent = comment.comment;
            
            const buttonGroup = document.createElement('div');
            buttonGroup.className = 'button-group';
            
            const copyBtn = document.createElement('button');
            copyBtn.className = 'btn btn-primary';
            copyBtn.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
                コピー
            `;
            copyBtn.onclick = () => copyComment(comment.comment, copyBtn);
            
            const completeBtn = document.createElement('button');
            completeBtn.className = 'btn btn-success';
            completeBtn.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                完了
            `;
            completeBtn.onclick = () => markAsComplete(comment.rowIndex, completeBtn, commentItem);
            
            buttonGroup.appendChild(copyBtn);
            buttonGroup.appendChild(completeBtn);
            
            commentItem.appendChild(commentMeta);
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
        button.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            コピー済み
        `;
        
        setTimeout(() => {
            button.innerHTML = originalHTML;
        }, 2000);
    } catch (err) {
        console.error('コピーに失敗しました:', err);
        alert('コピーに失敗しました');
    }
}

// 完了状態に更新する関数
async function markAsComplete(rowIndex, button, commentItem) {
    button.disabled = true;
    button.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
        </svg>
        更新中...
    `;
    
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
        
        // アニメーションで非表示
        commentItem.style.transition = 'all 0.3s ease';
        commentItem.style.opacity = '0';
        commentItem.style.transform = 'scale(0.95)';
        
        setTimeout(() => {
            commentItem.remove();
            
            // ポスターセクションが空になったら削除
            const posterSection = document.querySelector(`[data-poster="${commentItem.closest('.poster-section').getAttribute('data-poster')}"]`);
            const remainingComments = posterSection.querySelectorAll('.comment-item');
            
            if (remainingComments.length === 0) {
                posterSection.style.transition = 'all 0.3s ease';
                posterSection.style.opacity = '0';
                posterSection.style.transform = 'scale(0.95)';
                
                setTimeout(() => {
                    posterSection.remove();
                    checkIfEmpty();
                }, 300);
            } else {
                // コメント数を更新
                const countElement = posterSection.querySelector('.comment-count');
                countElement.textContent = `${remainingComments.length}件`;
            }
            
            // 統計を更新
            updateStatsAfterComplete();
        }, 300);
        
    } catch (error) {
        console.error('Error:', error);
        button.disabled = false;
        button.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            完了
        `;
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
    
    if (sections.length === 0) {
        document.getElementById('content').innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">✅</div>
                <div class="empty-text">すべて完了しました</div>
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
    }, 2000);
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
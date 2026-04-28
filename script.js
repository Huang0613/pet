const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');
// 1. 先列出你所有的動物檔名 (請確認 images 資料夾裡有這些檔案)
const petFiles = ['./mouse.png', 'duck.png', 'cat.png', 'capybaras.png']; 

// 2. 建立一個陣列來存入所有的圖片物件
const petImages = [];

// 3. 用迴圈把每一張圖都讀取進來
petFiles.forEach(file => {
    const img = new Image();
    img.src = './images/' + file;
    petImages.push(img);
});
// 遊戲設定
let basket = { x: 160, y: 550, width: 80, height: 20 };
let objects = []; 
let score = 0;
let lives = 3;
let gameOver = false;
let gameStarted = false;
let spawnTimer;

// --- 難度與時間控制變數 ---
let lastTime = 0;
const INITIAL_SPEED = 0.3; // 基礎速度
let currentLevel = 1;      
let levelUpTimer = 0;      

function drawBasket() {
    ctx.fillStyle = "brown";
    ctx.fillRect(basket.x, basket.y, basket.width, basket.height);
}

function drawObject(o) {
    if (o.type === "animal") { // 👈 這裡也改成了 animal
        const currentPet = petImages[o.petIndex];
        if (currentPet) {
            // 畫出你親手畫的動物，40, 40 是顯示大小
            ctx.drawImage(currentPet, o.x - 40, o.y - 40, 80, 80);
        }
    } else {
        // 炸彈維持原樣（或者是你也可以畫一個壞壞的表情圖片來換）
        ctx.beginPath();
        ctx.arc(o.x, o.y, 10, 0, Math.PI * 2);
        ctx.fillStyle = "black";
        ctx.fill();
        ctx.closePath();
    }
}

function spawnObject() {
    let x = Math.random() * (canvas.width - 40) + 20;
    let type = Math.random() < 0.4 ? "bomb" : "animal";    
    let petIndex = Math.floor(Math.random() * petImages.length);
    
    objects.push({ 
        x: x, 
        y: 0, 
        type: type,
        petIndex: petIndex 
    });
}

function endGame() {
    gameOver = true;
    clearInterval(spawnTimer);
}

function update(timestamp) {
    if (gameOver) {
        // 確保這行有執行，才會把原本那層灰灰的東西擦掉
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = "#4A4A4A"; 
        ctx.textAlign = "center";
        ctx.font = "bold 42px Arial";
        ctx.fillText("遊戲結束", canvas.width / 2, 180);

        ctx.fillStyle = "#FF6B6B"; 
        ctx.font = "bold 32px Arial";
        ctx.fillText("最終得分：" + score, canvas.width / 2, 280);

        restartBtn.style.display = "block";
        return;
    }

    const deltaTime = timestamp - lastTime;
    lastTime = timestamp;

    // 計算等級與速度
    let newLevel = Math.floor(score / 10) + 1;
    if (newLevel > currentLevel) {
        currentLevel = newLevel;
        levelUpTimer = 60; 
    }
    let currentSpeed = INITIAL_SPEED + ((currentLevel - 1) * 0.05);

ctx.clearRect(0, 0, canvas.width, canvas.height);

    // --- 強制繪製標題測試 ---
    if (!gameStarted) {
        console.log("正在繪製標題..."); // 如果你在 F12 沒看到這行，代表 gameStarted 邏輯有問題
        ctx.save();
        ctx.beginPath(); // 確保路徑乾淨
        ctx.fillStyle = "#FF6B6B"; 
        ctx.font = "bold 42px 'Microsoft JhengHei', Arial"; 
        ctx.textAlign = "center";
        ctx.textBaseline = "middle"; // 確保垂直對齊
        
        // 畫在畫布寬度一半 (200)，高度 230
        ctx.fillText("萌寵接接樂", canvas.width / 2, 230); 
        ctx.restore();
    }

    // --- 繪製 UI (分數與生命) ---
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)"; 

// ✨ 繪製 UI (分數與生命)
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)"; 
    ctx.font = "bold 18px Arial";

    // 1. 畫分數 (固定在左邊)
    ctx.textAlign = "left";
    ctx.fillText("分數: " + score, 20, 35);

    // 2. 畫生命值 (固定基準點在距離右邊 100 像素的位置)
    let lifeBaseX = canvas.width - 100; 

    ctx.textAlign = "right";
    ctx.fillText("生命: ", lifeBaseX, 35); // 標籤往左長，尾巴固定在 lifeBaseX

    ctx.textAlign = "left";
    ctx.fillText("❤️".repeat(lives), lifeBaseX, 35); // 愛心往右長，起點固定在 lifeBaseX

    drawBasket();

    for (let i = objects.length - 1; i >= 0; i--) {
        let o = objects[i];
        o.y += currentSpeed * deltaTime;

        if (o.y + 10 > basket.y && o.x > basket.x && o.x < basket.x + basket.width) {
            if (o.type === "animal") {
                score++;
            } else {
                lives--;
                if (lives <= 0) endGame();
            }
            objects.splice(i, 1);
            continue;
        }

        if (o.y > canvas.height) {
            if (o.type === "animal") {
                lives--;
                if (lives <= 0) endGame();
            }
            objects.splice(i, 1);
            continue;
        }
        drawObject(o);
    }

    if (levelUpTimer > 0) {
        ctx.save();
        ctx.textAlign = "center";
        ctx.font = "bold 40px Arial";
        ctx.fillStyle = levelUpTimer % 10 < 5 ? "#FF4500" : "#FFD700"; 
        ctx.fillText("SPEED UP!!", canvas.width / 2, 150);
        ctx.restore();
        levelUpTimer--;
    }

    requestAnimationFrame(update);
}

const handleMove = (clientX) => {
    const rect = canvas.getBoundingClientRect();
    let x = (clientX - rect.left) * (canvas.width / rect.width);
    let newX = x - basket.width / 2;
    if (newX < 0) newX = 0;
    if (newX > canvas.width - basket.width) newX = canvas.width - basket.width;
    basket.x = newX;
};

canvas.addEventListener("mousemove", (e) => handleMove(e.clientX));
canvas.addEventListener("touchmove", (e) => {
    e.preventDefault();
    handleMove(e.touches[0].clientX);
}, { passive: false });

startBtn.addEventListener('click', () => {
    if (gameStarted) return;
    gameStarted = true;
    startBtn.style.display = "none";
    lastTime = performance.now();
    requestAnimationFrame(update);
    spawnTimer = setInterval(spawnObject, 800);
});

restartBtn.addEventListener('click', () => {
    location.reload();
});
// ✨ 這是讓遊戲還沒開始前，先畫出初始畫面（標題）的秘密武器
function drawInitialScreen() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 繪製標題
    ctx.save();
    ctx.fillStyle = "#FF6B6B"; 
    ctx.font = "bold 42px 'Microsoft JhengHei', Arial"; 
    ctx.textAlign = "center";
    ctx.shadowBlur = 5;
    ctx.shadowColor = "rgba(0,0,0,0.2)";
    ctx.fillText("萌寵接接樂", canvas.width / 2, 230); 
    ctx.restore();

    // 如果你有其他想在開始前顯示的東西（例如籃子），也可以加在這裡
    drawBasket();
}

// 網頁載入完成後立刻執行
window.onload = drawInitialScreen;
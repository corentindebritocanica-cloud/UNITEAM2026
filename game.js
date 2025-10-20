// Attendre que la page soit chargée
window.addEventListener('load', () => {

    // --- AJOUT FIREBASE ---
    const firebaseConfig = {
        apiKey: "VOTRE_API_KEY", // N'oubliez pas de mettre votre config ici !
        authDomain: "VOTRE-PROJET.firebaseapp.com",
        projectId: "VOTRE-PROJET-ID",
        storageBucket: "VOTRE-PROJET.appspot.com",
        messagingSenderId: "VOTRE_SENDER_ID",
        appId: "VOTRE_APP_ID"
    };

    firebase.initializeApp(firebaseConfig);
    const db = firebase.firestore();
    const scoresCollection = db.collection("scores");
    // --- FIN AJOUT FIREBASE ---


    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    
    const scoreEl = document.getElementById('score');
    const startScreenEl = document.getElementById('startScreen');
    const gameOverScreenEl = document.getElementById('gameOverScreen');
    const finalScoreEl = document.getElementById('finalScore');
    
    const playerNameInput = document.getElementById('playerNameInput');
    const startGameBtn = document.getElementById('startGameBtn');
    const leaderboardListEl = document.getElementById('leaderboardList');
    const restartTextEl = document.getElementById('restartText');

    const music = new Audio('MONTAGE UNITEAM NOVEMBRE 2025.mp3'); 
    music.loop = true; 

    canvas.height = window.innerHeight * 0.9;
    canvas.width = canvas.height * (9 / 16);
    if (canvas.width > window.innerWidth * 0.95) {
        canvas.width = window.innerWidth * 0.95;
        canvas.height = canvas.width * (16 / 9);
    }

    let player, obstacles, score, gameSpeed, gravity, isGameOver;
    let gameLoopId; 
    let playerName = "Anonyme"; 

    const groundY = canvas.height - 70; 

    // --- AJOUT IMAGES OBSTACLES (NOMS PROPRES) ---
    const obstacleImages = [];
    const imagePaths = [
        'cactus1.png',
        'cactus2.png',
        'cactus3.png',
        'cactus4.png' 
    ];

    let imagesLoadedCount = 0;
    // Charger toutes les images d'obstacles
    function loadObstacleImages() {
        return new Promise(resolve => {
            if (imagePaths.length === 0) {
                resolve();
                return;
            }
            
            imagePaths.forEach(path => {
                const img = new Image();
                img.src = path;
                img.onload = () => {
                    obstacleImages.push(img);
                    imagesLoadedCount++;
                    if (imagesLoadedCount === imagePaths.length) {
                        console.log("Toutes les images d'obstacles chargées !");
                        resolve(); 
                    }
                };
                img.onerror = () => {
                    console.error(`Erreur de chargement de l'image : ${path}`);
                    imagesLoadedCount++; 
                    if (imagesLoadedCount === imagePaths.length) {
                        resolve();
                    }
                };
            });
        });
    }
    // --- FIN AJOUT IMAGES OBSTACLES ---

    class Player {
        constructor(x, y, w, h, color) {
            this.x = x; this.y = y; this.w = w; this.h = h; this.color = color;
            this.dy = 0; this.jumpPower = 15; this.isGrounded = false;
        }
        draw() {
            ctx.fillStyle = this.color;
            ctx.fillRect(this.x, this.y, this.w, this.h);
        }
        update() {
            this.dy += gravity;
            this.y += this.dy;
            if (this.y + this.h > groundY) {
                this.y = groundY - this.h;
                this.dy = 0;
                this.isGrounded = true;
            }
            this.draw();
        }
        jump() {
            if (this.isGrounded) {
                this.dy = -this.jumpPower;
                this.isGrounded = false;
            }
        }
    }

    class Obstacle {
        constructor(x, y, image, w, h) { 
            this.x = x;
            this.y = y;
            this.w = w || image.width;
            this.h = h || image.height;
            this.image = image; 
        }
        draw() {
            ctx.drawImage(this.image, this.x, this.y, this.w, this.h);
        }
        update() {
            this.x -= gameSpeed; 
            this.draw();
        }
    }

    async function init() { 
        player = new Player(50, groundY - 50, 40, 40, '#007bff'); 
        obstacles = [];
        score = 0;
        gameSpeed = 5;
        gravity = 0.8;
        isGameOver = false;

        scoreEl.innerText = 'Score: 0';
        gameOverScreenEl.style.display = 'none';
        startScreenEl.style.display = 'flex';
        
        music.pause();
        music.currentTime = 0;

        if (obstacleImages.length === 0) { 
            leaderboardListEl.innerHTML = "<li>Chargement des images...</li>";
            await loadObstacleImages();
            leaderboardListEl.innerHTML = "<li>Chargement...</li>"; 
        }
        
        displayLeaderboard();
    }

    function startGame() {
        playerName = playerNameInput.value || "Anonyme"; 
        
        if (gameLoopId) return; 

        startScreenEl.style.display = 'none';
        
        music.play();
        
        gameLoopId = requestAnimationFrame(gameLoop);

        window.addEventListener('touchstart', handleGameInput, { passive: false });
        window.addEventListener('mousedown', handleGameInput);
    }

    let obstacleTimer = 0; 
    function gameLoop() {
        if (isGameOver) return; 

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#666';
        ctx.fillRect(0, groundY, canvas.width, 70);

        player.update();

        obstacleTimer++;
        
        let spawnInterval = Math.max(80, 150 - (gameSpeed * 5)); 
        
        if (obstacleTimer > spawnInterval && obstacleImages.length > 0) { 
            const randomIndex = Math.floor(Math.random() * obstacleImages.length);
            const selectedImage = obstacleImages[randomIndex];
            
            let obstacleWidth = 50; 
            let obstacleHeight = (selectedImage.height / selectedImage.width) * obstacleWidth;

            if (obstacleHeight > 80) {
                 obstacleHeight = 80;
                 obstacleWidth = (selectedImage.width / selectedImage.height) * obstacleHeight;
            }

            let newObstacle = new Obstacle(canvas.width, groundY - obstacleHeight, selectedImage, obstacleWidth, obstacleHeight);
            obstacles.push(newObstacle);
            
            obstacleTimer = 0 - (Math.random() * 20); 
        }

        for (let i = obstacles.length - 1; i >= 0; i--) {
            let obs = obstacles[i];
            obs.update();

            if (
                player.x < obs.x + obs.w &&
                player.x + player.w > obs.x &&
                player.y < obs.y + obs.h &&
                player.y + player.h > obs.y
            ) {
                endGame();
            }

            if (obs.x + obs.w < 0) {
                obstacles.splice(i, 1);
                updateScore();
            }
        }
        
        gameSpeed += 0.003;
        gameLoopId = requestAnimationFrame(gameLoop);
    }

    function updateScore() {
        score++;
        scoreEl.innerText = `Score: ${score}`;
    }

    async function endGame() {
        if (isGameOver) return;
        
        isGameOver = true;
        cancelAnimationFrame(gameLoopId); 
        gameLoopId = null; 
        
        window.removeEventListener('touchstart', handleGameInput);
        window.removeEventListener('mousedown', handleGameInput);
        
        music.pause();
        music.currentTime = 0; 
        
        finalScoreEl.innerText = score;
        gameOverScreenEl.style.display = 'flex';
        
        leaderboardListEl.innerHTML = "<li>Sauvegarde...</li>";
        try {
            await saveScore(playerName, score);
            await displayLeaderboard();
        } catch (error) {
            console.error("Erreur avec Firebase: ", error);
            leaderboardListEl.innerHTML = "<li>Erreur de classement</li>";
        }
    }

    function resetGame() {
        init(); 
    }
    
    function handleGameInput(e) {
        if (e) e.preventDefault();
        if (!isGameOver) {
            player.jump();
        }
    }

    startGameBtn.addEventListener('click', startGame);
    startGameBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        startGame();
    }, { passive: false });

    restartTextEl.addEventListener('click', resetGame);
    restartTextEl.addEventListener('touchstart', (e) => {
        e.preventDefault();
        resetGame();
    }, { passive: false });

    async function saveScore(name, score) {
        try {
            await scoresCollection.add({
                name: name,
                score: score,
                timestamp: new Date()
            });
            console.log("Score sauvegardé !");
        } catch (error) {
            console.error("Erreur de sauvegarde: ", error);
        }
    }

    async function displayLeaderboard() {
        leaderboardListEl.innerHTML = "<li>Chargement...</li>";
        
        try {
            const snapshot = await scoresCollection
                .orderBy("score", "desc")
                .limit(5)
                .get();

            if (snapshot.empty) {
                leaderboardListEl.innerHTML = "<li>Aucun score</li>";
                return;
            }

            leaderboardListEl.innerHTML = "";
            let rank = 1;
            snapshot.forEach(doc => {
                const data = doc.data();
                const li = document.createElement("li");
                li.innerHTML = `${rank}. ${data.name}: <strong>${data.score}</strong>`;
                leaderboardListEl.appendChild(li);
                rank++;
            });

        } catch (error) {
            console.error("Erreur de lecture: ", error);
            leaderboardListEl.innerHTML = "<li>Erreur de classement</li>";
        }
    }
    
    init();
});
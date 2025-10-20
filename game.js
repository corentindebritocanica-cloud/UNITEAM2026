// Attendre que la page soit chargée
window.addEventListener('load', () => {

    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    
    const scoreEl = document.getElementById('score');
    const startScreenEl = document.getElementById('startScreen');
    const gameOverScreenEl = document.getElementById('gameOverScreen');
    const finalScoreEl = document.getElementById('finalScore');
    const startTextEl = startScreenEl.querySelector('p'); 

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
    let isReady = false; 

    const groundY = canvas.height - 70; 

    const obstacleImages = [];
    const imagePaths = [
        'cactus1.png',
        'cactus2.png',
        'cactus3.png',
        'cactus4.png' 
    ];

    let imagesLoadedCount = 0;
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
        isReady = false; 
        startTextEl.innerText = "Chargement..."; 

        player = new Player(50, groundY - 50, 40, 40, '#007bff'); 
        obstacles = [];
        score = 0;
        gameSpeed = 5;
        gravity = 0.8;
        isGameOver = false;

        scoreEl.innerText = 'Score: 0';
        gameOverScreenEl.style.display = 'none'; // <- Cache l'écran Game Over
        startScreenEl.style.display = 'flex'; // <- Montre l'écran de début
        
        music.pause();
        music.currentTime = 0;

        // On s'assure que les images sont chargées (ne se recharge pas si déjà fait)
        if (obstacleImages.length === 0) { 
            console.log("Chargement des images...");
            await loadObstacleImages();
        }

        isReady = true; 
        startTextEl.innerText = "Appuyez pour commencer"; 
    }

    function startGame() {
        if (gameLoopId) return; 
        startScreenEl.style.display = 'none';
        
        var promise = music.play();
        if (promise !== undefined) {
            promise.then(_ => {
                console.log("Musique lancée !");
            }).catch(error => {
                console.log("La musique a été bloquée par le navigateur.");
            });
        }
        
        gameLoopId = requestAnimationFrame(gameLoop);
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

    function endGame() { // Pas besoin que 'endGame' soit async
        if (isGameOver) return;
        
        isGameOver = true;
        cancelAnimationFrame(gameLoopId); 
        gameLoopId = null; 
        
        music.pause();
        music.currentTime = 0; 
        
        finalScoreEl.innerText = score;
        gameOverScreenEl.style.display = 'flex';
    }

    // --- MODIFIÉ ---
    // On rend resetGame 'async' pour qu'il puisse 'await' init
    async function resetGame() {
        await init(); // On attend que l'initialisation soit VRAIMENT finie
    }
    
    // --- MODIFIÉ ---
    // On rend handleInput 'async' pour qu'il puisse 'await' resetGame
    async function handleInput() {
        // On permet le tap sur l'écran Game Over même si le jeu n'est pas "prêt"
        if (!isReady && !isGameOver) return; 

        if (isGameOver) {
            await resetGame(); // On attend que le reset soit VRAIMENT fini
        } else {
            if (!gameLoopId) {
                startGame();
            }
            player.jump();
        }
    }
    
    window.addEventListener('touchstart', handleInput, { passive: false });
    window.addEventListener('mousedown', handleInput);
    
    init();
});
// Attendre que la page soit chargée
window.addEventListener('load', () => {

    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    
    const gameContainer = document.querySelector('.game-container');
    const scoreEl = document.getElementById('score');
    const startScreenEl = document.getElementById('startScreen');
    const gameOverScreenEl = document.getElementById('gameOverScreen');
    const finalScoreEl = document.getElementById('finalScore');
    const loadingText = document.getElementById('loadingText'); 
    
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const musicPaths = [
        'music1.mp3', 'music2.mp3', 'music3.mp3', 'music4.mp3', 'music5.mp3'
    ];
    let currentMusic = null; 

    let player, obstacles, collectibles, particles, score, gameSpeed, gravity, isGameOver, gameLoopId;
    let isReady = false; 

    const groundY = canvas.height - 70;

    const obstacleImages = [];
    const playerHeadImages = []; 
    const collectibleImages = [];
    
    let selectedHeadImage = null; 
    const PLAYER_WIDTH = 50; 
    const PLAYER_HEIGHT = 50; 
    
    const collectibleImagePaths = ['note.png'];
    const obstacleImagePaths = [
        'cactus1.png', 'cactus2.png', 'cactus3.png', 'cactus4.png' 
    ];
    const playerImagePaths = [
        'perso1.png', 'perso2.png', 'perso3.png', 'perso4.png', 'perso5.png',
        'perso6.png', 'perso7.png', 'perso8.png', 'perso9.png', 'perso10.png',
        'perso11.png', 'perso12.png', 'perso13.png', 'perso14.png', 'perso15.png',
        'perso16.png', 'perso17.png', 'perso18.png'
    ];
    
    let imagesLoadedCount = 0;
    const totalImages = obstacleImagePaths.length + playerImagePaths.length + collectibleImagePaths.length;

    function loadGameImages() {
        return new Promise(resolve => {
            if (playerHeadImages.length > 0) { 
                resolve();
                return;
            }
            if (totalImages === 0) resolve();
            
            const loadImage = (path, targetArray) => {
                const img = new Image();
                img.src = path;
                img.onload = () => {
                    targetArray.push(img);
                    imagesLoadedCount++;
                    if (imagesLoadedCount === totalImages) {
                        console.log("Toutes les images chargées !");
                        resolve(); 
                    }
                };
                img.onerror = () => {
                    console.error(`Erreur de chargement : ${path}`);
                    imagesLoadedCount++; 
                    if (imagesLoadedCount === totalImages) resolve();
                };
            };
            
            obstacleImagePaths.forEach(path => loadImage(path, obstacleImages));
            playerImagePaths.forEach(path => loadImage(path, playerHeadImages));
            collectibleImagePaths.forEach(path => loadImage(path, collectibleImages));
        });
    }

    // --- Classe Particule (inchangée) ---
    class Particle {
        constructor(x, y, color) {
            this.x = x; this.y = y; this.color = color;
            this.size = Math.random() * 4 + 2; 
            this.vx = -gameSpeed / 2; 
            this.vy = (Math.random() - 0.5) * 2; 
            this.life = 30; 
            this.gravity = 0.1;
        }
        update() {
            this.life--; this.vy += this.gravity; this.x += this.vx; this.y += this.vy;
        }
        draw() {
            ctx.fillStyle = this.color; ctx.globalAlpha = this.life / 30; 
            ctx.fillRect(this.x, this.y, this.size, this.size);
            ctx.globalAlpha = 1.0; 
        }
    }

    // --- CLASSE PLAYER (MODIFIÉE pour le double saut) ---
    class Player {
        constructor(x, y, w, h, image) {
            this.x = x; this.y = y; this.w = w; this.h = h; this.image = image;
            this.dy = 0; 
            this.jumpPower = 15; 
            this.isGrounded = false;
            // --- AJOUT DOUBLE SAUT : Compteur de sauts ---
            this.jumpCount = 0; 
            this.maxJumps = 2; // On autorise 2 sauts
        }
        draw() {
            if (this.image) {
                ctx.drawImage(this.image, this.x, this.y, this.w, this.h);
            } else { 
                ctx.fillStyle = '#007bff';
                ctx.fillRect(this.x, this.y, this.w, this.h);
            }
        }
        
        emitParticles() {
            const colors = ['#FFD700', '#FFFFFF', '#C0C0C0', '#FFEC8B'];
            const color = colors[Math.floor(Math.random() * colors.length)];
            const x = this.x + this.w / 2; const y = this.y + this.h / 2;
            particles.push(new Particle(x, y, color));
        }

        update() {
            this.dy += gravity; this.y += this.dy;
            
            // Si on touche le sol
            if (this.y + this.h > groundY) {
                this.y = groundY - this.h; this.dy = 0; this.isGrounded = true;
                // --- AJOUT DOUBLE SAUT : Réinitialiser le compteur au sol ---
                this.jumpCount = 0; 
            } else {
                this.isGrounded = false;
            }
            
            this.draw();
            
            if (!isGameOver) {
                this.emitParticles();
            }
        }
        
        // --- MODIFICATION DOUBLE SAUT : Fonction de saut ---
        jump() {
            // Si on peut encore sauter (moins de 2 sauts faits)
            if (this.jumpCount < this.maxJumps) { 
                this.dy = -this.jumpPower; // Applique la force du saut
                this.jumpCount++; // Incrémente le compteur
                this.isGrounded = false; // On n'est plus au sol
            }
        }
    }
    
    // --- CLASSE OBSTACLE (inchangée) ---
    class Obstacle {
        constructor(x, y, image, w, h) { 
            this.x = x; this.y = y; this.w = w || image.width; this.h = h || image.height;
            this.image = image; 
        }
        draw() { ctx.drawImage(this.image, this.x, this.y, this.w, this.h); }
        update() { this.x -= gameSpeed; this.draw(); }
    }

    // --- CLASSE COLLECTIBLE (inchangée) ---
    class Collectible {
        constructor(x, y, image, w, h) { 
            this.x = x; this.y = y; this.w = w; this.h = h; this.image = image; 
        }
        draw() { ctx.drawImage(this.image, this.x, this.y, this.w, this.h); }
        update() { this.x -= gameSpeed; this.draw(); }
    }

    // --- 'initGameData' prépare une nouvelle partie ---
    async function initGameData() {
        gameContainer.classList.remove('shake');
        
        if (currentMusic) {
            currentMusic.pause();
            currentMusic.currentTime = 0;
            currentMusic = null;
        }
        
        const musicIndex = Math.floor(Math.random() * musicPaths.length);
        currentMusic = new Audio(musicPaths[musicIndex]);
        currentMusic.loop = true;

        if (playerHeadImages.length === 0) {
            await loadGameImages();
        }
        
        const randomIndex = Math.floor(Math.random() * playerHeadImages.length);
        selectedHeadImage = playerHeadImages.length > 0 ? playerHeadImages[randomIndex] : null;

        gravity = 0.8;
        player = new Player(50, groundY - PLAYER_HEIGHT, PLAYER_WIDTH, PLAYER_HEIGHT, selectedHeadImage); 
        player.isGrounded = true;
        obstacles = [];
        collectibles = [];
        particles = [];
        score = 0;
        gameSpeed = 5; 
        isGameOver = false;
        gameLoopId = null; 

        scoreEl.innerText = 'Score: 0';
    }

    // --- 'initMenu' prépare le menu de démarrage ---
    async function initMenu() { 
        isReady = false; 
        loadingText.innerText = "Chargement..."; 
        
        gameContainer.classList.remove('in-game');
        
        await initGameData(); 

        gameOverScreenEl.style.display = 'none';
        startScreenEl.style.display = 'flex';
        
        isReady = true; 
        loadingText.innerText = "Appuyez pour commencer"; 
    }

    // --- Démarrage du jeu ---
    function startGame() {
        if (gameLoopId) return; 
        
        gameContainer.classList.add('in-game');
        
        startScreenEl.style.display = 'none';
        gameOverScreenEl.style.display = 'none';
        
        var promise = currentMusic.play();
        if (promise !== undefined) promise.catch(e => console.log("Musique bloquée"));
        
        gameLoopId = requestAnimationFrame(gameLoop);
    }

    // --- Boucle de jeu principale ---
    let obstacleTimer = 0; 
    let collectibleTimer = 150; 
    const OBSTACLE_SPAWN_INTERVAL = 90; 

    function gameLoop() {
        if (isGameOver) return; 

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const dayNightProgress = (score % 500) / 500; 
        const nightOpacity = Math.sin(dayNightProgress * Math.PI) * 0.7; 
        ctx.fillStyle = `rgba(0, 0, 50, ${nightOpacity})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = '#666';
        ctx.fillRect(0, groundY, canvas.width, 70); 
        
        // Màj Paillettes
        for (let i = particles.length - 1; i >= 0; i--) {
            let p = particles[i];
            p.update();
            p.draw();
            if (p.life <= 0) {
                particles.splice(i, 1);
            }
        }
        
        player.update(); 

        obstacleTimer++;
        collectibleTimer++;
        
        let spawnInterval = Math.max(OBSTACLE_SPAWN_INTERVAL - (gameSpeed * 5), 40); 
        
        // Apparition Obstacles
        if (obstacleTimer > spawnInterval && obstacleImages.length > 0) { 
            const cactusImg = obstacleImages[Math.floor(Math.random() * obstacleImages.length)];
            let w = 50; 
            let h = (cactusImg.height / cactusImg.width) * w;
            if (h > 80) { h = 80; w = (cactusImg.width / cactusImg.height) * h; }
            obstacles.push(new Obstacle(canvas.width, groundY - h, cactusImg, w, h));
            obstacleTimer = 0 - (Math.random() * 20); 
        }
        
        // Apparition Collectibles
        if (collectibleTimer > 200 && collectibleImages.length > 0) { 
            const noteImg = collectibleImages[0];
            const y = groundY - 120 - (Math.random() * 100); 
            collectibles.push(new Collectible(canvas.width, y, noteImg, 30, 30));
            collectibleTimer = 0;
        }

        // Collisions Collectibles
        for (let i = collectibles.length - 1; i >= 0; i--) {
            let coll = collectibles[i];
            coll.update();
            if (
                player.x < coll.x + coll.w && player.x + player.w > coll.x &&
                player.y < coll.y + coll.h && player.y + player.h > coll.y
            ) {
                updateScore(10); 
                collectibles.splice(i, 1); 
            } 
            else if (coll.x + coll.w < 0) {
                collectibles.splice(i, 1);
            }
        }
        
        // Collisions Obstacles
        for (let i = obstacles.length - 1; i >= 0; i--) {
            let obs = obstacles[i];
            obs.update();
            
            const playerHitbox = {x: player.x + 5, y: player.y + 5, w: player.w - 10, h: player.h - 10};
            const obsHitbox = {x: obs.x + 5, y: obs.y + 5, w: obs.w - 10, h: obs.h - 10};

            if (
                playerHitbox.x < obsHitbox.x + obsHitbox.w &&
                playerHitbox.x + playerHitbox.w > obsHitbox.x &&
                playerHitbox.y < obs.y + obs.h && 
                playerHitbox.y + playerHitbox.h > obs.y
            ) {
               endGame();
            }
            
            if (obs.x + obs.w < 0) {
                obstacles.splice(i, 1);
                updateScore(1); 
            }
        }
        
        gameSpeed += 0.003; 
        
        gameLoopId = requestAnimationFrame(gameLoop);
    }

    function updateScore(value = 1) {
        score += value;
        scoreEl.innerText = `Score: ${Math.floor(score)}`; 
    }

    // --- Fin de partie ---
    function endGame() {
        if (isGameOver) return;
        isGameOver = true;
        cancelAnimationFrame(gameLoopId); 
        gameLoopId = null; 
        
        if (currentMusic) {
            currentMusic.pause();
            currentMusic.currentTime = 0; 
        }
        
        finalScoreEl.innerText = Math.floor(score);
        gameOverScreenEl.style.display = 'flex'; 

        gameContainer.classList.add('shake');
        setTimeout(() => {
            gameContainer.classList.remove('shake');
        }, 300);
    }

    // --- 'resetGame' retourne au menu ---
    async function resetGame() {
        await initMenu(); 
    }
    
    // --- 'handleInput' gère tous les taps ---
    async function handleInput(e) {
        if(e) e.preventDefault();
        
        if (!isReady && !isGameOver) return; 

        if (isGameOver) {
            await resetGame(); 
        } else {
            if (!gameLoopId) {
                startGame(); 
            }
            // --- MODIFICATION DOUBLE SAUT : Appelle la fonction jump() qui gère le compteur ---
            player.jump(); 
        }
    }
    
    window.addEventListener('touchstart', handleInput, { passive: false });
    window.addEventListener('mousedown', handleInput);
    
    // Lancement initial (vers le menu)
    initMenu();
});
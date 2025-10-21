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
    
    const powerUpTextEl = document.getElementById('powerUpText');
    const powerUpTimerEl = document.getElementById('powerUpTimer');
    
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Musiques
    const musicPaths = [ 'music1.mp3', 'music2.mp3', 'music3.mp3', 'music4.mp3', 'music5.mp3' ];
    let currentMusic = null; 

    // Variables du jeu
    let player, obstacles, collectibles, particles, powerUps, backgroundCharacters, score, gameSpeed, gravity, isGameOver, gameLoopId;
    let isReady = false; 
    let activePowerUp = null; 
    let powerUpTimer = 0; 
    let powerUpDuration = 5; 
    // let powerUpSpawnTimer = 0; // Supprimé
    let isPowerUpActive = false; 
    let powerUpTextTimeout = null; 
    // --- Logique d'apparition des bonus par score ---
    let canSpawnPowerUp = false; 
    let nextPowerUpScoreThreshold = 30; 
    const POWERUP_SCORE_INTERVAL = 20; 
    
    let weatherEffect = null; 
    let weatherTimer = 0;

    const groundY = canvas.height - 70;

    // Images
    const obstacleImages = [];
    const playerHeadImages = []; 
    const collectibleImages = [];
    const powerUpImages = {}; 

    let selectedHeadImage = null; 
    const PLAYER_WIDTH = 50; 
    const PLAYER_HEIGHT = 50; 
    
    // Chemins des images
    const collectibleImagePaths = ['note.png'];
    const obstacleImagePaths = [ 'cactus1.png', 'cactus2.png', 'cactus3.png', 'cactus4.png' ];
    const playerImagePaths = [
        'perso1.png', 'perso2.png', 'perso3.png', 'perso4.png', 'perso5.png',
        'perso6.png', 'perso7.png', 'perso8.png', 'perso9.png', 'perso10.png',
        'perso11.png', 'perso12.png', 'perso13.png', 'perso14.png', 'perso15.png',
        'perso16.png', 'perso17.png', 'perso18.png'
    ];
    // Utilise .PNG pour les power-ups
    const powerUpImagePaths = {
        invincible: 'chapeau.PNG',
        superJump: 'botte.PNG',
        magnet: 'aimant.PNG'
    };
    
    let imagesLoadedCount = 0;
    const allImagePaths = [
        ...obstacleImagePaths, ...playerImagePaths, ...collectibleImagePaths, 
        ...Object.values(powerUpImagePaths) 
    ];
    const totalImages = allImagePaths.length;

    // Fonction pour charger TOUTES les images
    function loadGameImages() {
        return new Promise(resolve => {
            if (imagesLoadedCount === totalImages && playerHeadImages.length > 0) { 
                 resolve(); return; 
            }
            imagesLoadedCount = 0; 
            playerHeadImages.length = 0; obstacleImages.length = 0; collectibleImages.length = 0;
            Object.keys(powerUpImages).forEach(key => delete powerUpImages[key]); 

            if (totalImages === 0) resolve();
            
            let loadedCount = 0; 
            allImagePaths.forEach(path => {
                const img = new Image(); 
                img.src = path;
                img.onload = () => {
                    if (obstacleImagePaths.includes(path)) obstacleImages.push(img);
                    else if (playerImagePaths.includes(path)) playerHeadImages.push(img);
                    else if (collectibleImagePaths.includes(path)) collectibleImages.push(img);
                    else { 
                        for (const type in powerUpImagePaths) {
                            if (powerUpImagePaths[type] === path) {
                                powerUpImages[type] = img; break;
                            }
                        }
                    }
                    loadedCount++; imagesLoadedCount = loadedCount;
                    if (loadedCount === totalImages) { console.log("Images chargées !"); resolve(); }
                };
                img.onerror = () => {
                    console.error(`Erreur chargement : ${path}`); 
                    loadedCount++; imagesLoadedCount = loadedCount;
                    if (loadedCount === totalImages) resolve();
                };
            });
        });
    }

    // --- Classe Particule ---
    class Particle { 
        constructor(x, y, color) {
            this.x = x; this.y = y; this.color = color;
            this.size = Math.random() * 4 + 3; 
            this.vx = -gameSpeed / 3; 
            this.vy = (Math.random() - 0.5) * 2; 
            this.life = 40; 
            this.gravity = 0.1;
        }
        update() { this.life--; this.vy += this.gravity; this.x += this.vx; this.y += this.vy; }
        draw() {
            ctx.fillStyle = this.color; ctx.globalAlpha = Math.max(0, this.life / 40); 
            ctx.fillRect(this.x, this.y, this.size, this.size);
            ctx.globalAlpha = 1.0; 
        }
    }

    // --- CLASSE PLAYER ---
    class Player {
        constructor(x, y, w, h, image) {
            this.x = x; this.y = y; this.w = w; this.h = h; this.image = image;
            this.dy = 0; this.baseJumpPower = 15; this.jumpPower = this.baseJumpPower;
            this.isGrounded = false; this.jumpCount = 0; this.maxJumps = 2; 
            this.isInvincible = false;
        }
        draw() { 
            if (this.isInvincible && Math.floor(Date.now() / 100) % 2 === 0) { /* Clignote */ } 
            else if (this.image) { ctx.drawImage(this.image, this.x, this.y, this.w, this.h); } 
            else { ctx.fillStyle = '#007bff'; ctx.fillRect(this.x, this.y, this.w, this.h); }
        }
        emitParticles(colorOverride = null) { 
            if (gameLoopId && !isGameOver) {
                 const colors = ['#FFD700', '#FFFFFF', '#C0C0C0', '#FFEC8B'];
                 const color = colorOverride || colors[Math.floor(Math.random() * colors.length)];
                 const x = this.x + this.w / 2; const y = this.y + this.h / 2;
                 particles.push(new Particle(x, y, color));
            }
        }
        update() {
            this.dy += gravity; this.y += this.dy;
            if (this.y + this.h >= groundY) { 
                this.y = groundY - this.h; this.dy = 0; 
                if (!this.isGrounded) { this.jumpCount = 0; }
                this.isGrounded = true;
            } else { this.isGrounded = false; }
            this.draw(); this.emitParticles();
        }
        jump() {
            if (this.jumpCount < this.maxJumps) { 
                this.dy = -this.jumpPower; this.jumpCount++; this.isGrounded = false; 
            }
        }
    }
    
    // --- CLASSE OBSTACLE ---
    class Obstacle { 
        constructor(x, y, image, w, h) { 
            this.x = x; this.y = y; this.w = w || image.width; this.h = h || image.height;
            this.image = image; this.initialY = y;
            this.verticalSpeed = (Math.random() < 0.1) ? (Math.random() * 0.8 - 0.4) : 0; 
            this.verticalRange = 15;
        }
        draw() { ctx.drawImage(this.image, this.x, this.y, this.w, this.h); }
        update() { 
            this.x -= gameSpeed; 
            if (this.verticalSpeed !== 0) {
                this.y += this.verticalSpeed;
                if (this.y < this.initialY - this.verticalRange || this.y > this.initialY + this.verticalRange) {
                    this.verticalSpeed *= -1;
                }
            }
            this.draw(); 
        }
    }

    // --- CLASSE COLLECTIBLE ---
    class Collectible { 
        constructor(x, y, image, w, h) { 
            this.x = x; this.y = y; this.w = w; this.h = h; this.image = image; 
        }
        draw() { ctx.drawImage(this.image, this.x, this.y, this.w, this.h); }
        update() { 
            if (activePowerUp === 'magnet') {
                const dx = player.x + player.w / 2 - (this.x + this.w / 2);
                const dy = player.y + player.h / 2 - (this.y + this.h / 2);
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 150) { this.x += dx * 0.05; this.y += dy * 0.05; }
            }
            this.x -= gameSpeed; this.draw(); 
        }
     }

    // --- CLASSE POWERUP ---
    class PowerUp { 
        constructor(x, y, type) {
            this.type = type; this.image = powerUpImages[type];
            if (!this.image) return null; 
            this.w = 40; this.h = (this.image.height / this.image.width) * this.w;
            this.x = x; this.y = y; this.initialY = y; this.angle = Math.random() * Math.PI * 2;
        }
        draw() { if (this.image) ctx.drawImage(this.image, this.x, this.y, this.w, this.h); }
        update() {
            this.x -= gameSpeed; this.angle += 0.05;
            this.y = this.initialY + Math.sin(this.angle) * 15; 
            this.draw();
        }
    }

     // --- CLASSE BACKGROUND CHARACTER ---
    class BackgroundCharacter {
        constructor(image, scale) {
            this.image = image; this.scale = scale; 
            this.w = PLAYER_WIDTH * this.scale; this.h = PLAYER_HEIGHT * this.scale;
            this.x = canvas.width + Math.random() * canvas.width; 
            this.baseY = groundY - this.h - Math.random() * 20; this.y = this.baseY;
            this.speed = gameSpeed * (0.1 + (scale - 0.3) * 0.3); 
            this.bounceAngle = Math.random() * Math.PI * 2; 
            this.bounceSpeed = 0.05 + Math.random() * 0.03;
        }
        draw() {
             ctx.globalAlpha = 0.4 + (this.scale - 0.3) * 0.5; 
             ctx.drawImage(this.image, this.x, this.y, this.w, this.h);
             ctx.globalAlpha = 1.0;
        }
        update() {
            this.x -= this.speed;
            this.speed = gameSpeed * (0.1 + (this.scale - 0.3) * 0.3); 
            this.bounceAngle += this.bounceSpeed;
            this.y = this.baseY + Math.sin(this.bounceAngle) * 5; 
            this.draw();
        }
    }

    // --- 'initGameData' prépare une nouvelle partie ---
    async function initGameData() { 
        gameContainer.classList.remove('shake');
        if (currentMusic) { currentMusic.pause(); currentMusic.currentTime = 0; currentMusic = null; }
        const musicIndex = Math.floor(Math.random() * musicPaths.length);
        currentMusic = new Audio(musicPaths[musicIndex]); currentMusic.loop = true;
        
        await loadGameImages(); 
        
        const randomIndex = Math.floor(Math.random() * playerHeadImages.length);
        selectedHeadImage = playerHeadImages.length > 0 ? playerHeadImages[randomIndex] : null;
        gravity = 0.8;
        player = new Player(50, groundY - PLAYER_HEIGHT, PLAYER_WIDTH, PLAYER_HEIGHT, selectedHeadImage); 
        player.isGrounded = true;
        obstacles = []; collectibles = []; particles = []; powerUps = []; backgroundCharacters = [];
        score = 0; gameSpeed = 5; isGameOver = false; gameLoopId = null; 
        activePowerUp = null; powerUpTimer = 0; isPowerUpActive = false; 
        weatherEffect = null; weatherTimer = 0; 
        // Réinitialiser la logique des bonus par score
        canSpawnPowerUp = false; 
        nextPowerUpScoreThreshold = 30;

        scoreEl.innerText = 'Score: 0';
        powerUpTextEl.innerText = ''; powerUpTimerEl.innerText = '';

         // Tous les personnages en fond
         if (playerHeadImages.length > 0) {
             playerHeadImages.forEach(headImage => { 
                 const scale = Math.random() * 0.3 + 0.3; 
                 backgroundCharacters.push(new BackgroundCharacter(headImage, scale));
             });
             backgroundCharacters.sort((a, b) => a.scale - b.scale); 
         }
    }

    // --- 'initMenu' prépare le menu ---
    async function initMenu() { 
        isReady = false; loadingText.innerText = "Chargement..."; 
        // gameContainer.classList.remove('in-game'); // Logo fixe
        await initGameData(); 
        gameOverScreenEl.style.display = 'none'; startScreenEl.style.display = 'flex'; 
        isReady = true; loadingText.innerText = "Appuyez pour commencer"; 
    }

    // --- Démarrage du jeu ---
    function startGame() { 
        if (gameLoopId || !isReady) return; 
        // gameContainer.classList.add('in-game'); // Logo fixe
        startScreenEl.style.display = 'none'; gameOverScreenEl.style.display = 'none';
        var promise = currentMusic.play();
        if (promise !== undefined) promise.catch(e => console.log("Musique bloquée:", e));
        lastTime = performance.now(); 
        gameLoopId = requestAnimationFrame(gameLoop);
    }

    // --- Fonctions PowerUp ---
    function activatePowerUp(type) {
        if (isPowerUpActive) return; 
        isPowerUpActive = true; activePowerUp = type; powerUpTimer = powerUpDuration; 
        canSpawnPowerUp = false; // Empêche nouveau spawn

        clearTimeout(powerUpTextTimeout); powerUpTextEl.classList.remove('fade-out'); 
        powerUpTextEl.innerText = ''; 
        switch(type) {
            case 'invincible': player.isInvincible = true; powerUpTextEl.innerText = "Invincible !"; break;
            case 'superJump': player.jumpPower = player.baseJumpPower * 1.5; powerUpTextEl.innerText = "Super Saut !"; break;
            case 'magnet': powerUpTextEl.innerText = "Aimant à Notes !"; break;
        }
        powerUpTextTimeout = setTimeout(() => { powerUpTextEl.classList.add('fade-out'); }, 2000); 
    }

    function deactivatePowerUp() {
        if (!isPowerUpActive) return;
        switch(activePowerUp) {
            case 'invincible': player.isInvincible = false; break;
            case 'superJump': player.jumpPower = player.baseJumpPower; break;
            case 'magnet': break;
        }
        isPowerUpActive = false; activePowerUp = null; powerUpTimer = 0;
        powerUpTextEl.innerText = ''; powerUpTimerEl.innerText = '';
        powerUpTextEl.classList.remove('fade-out'); 
        clearTimeout(powerUpTextTimeout); 
        // Définit le seuil pour le prochain bonus
        nextPowerUpScoreThreshold = Math.floor(score) + POWERUP_SCORE_INTERVAL; 
        console.log("Prochain bonus possible à partir de score :", nextPowerUpScoreThreshold);
    }
    
    // --- Boucle de jeu principale ---
    let obstacleTimer = 0; let collectibleTimer = 150; 
    const OBSTACLE_SPAWN_INTERVAL = 100; 

    function gameLoop(currentTime) { 
        if (isGameOver) { cancelAnimationFrame(gameLoopId); gameLoopId = null; return; }

        const deltaTime = (currentTime - lastTime) / 1000 || 0; 
        lastTime = currentTime;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Cycle Jour/Nuit & Météo
        const dayNightProgress = (score % 500) / 500; const nightOpacity = Math.sin(dayNightProgress * Math.PI) * 0.7; ctx.fillStyle = `rgba(0, 0, 50, ${nightOpacity})`; ctx.fillRect(0, 0, canvas.width, canvas.height);
        weatherTimer += deltaTime; if (weatherTimer > 30) { weatherTimer = 0; weatherEffect = (Math.random() < 0.3) ? 'rain' : null;} if (weatherEffect === 'rain') { ctx.fillStyle = 'rgba(100, 100, 200, 0.1)'; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.fillStyle = 'rgba(200, 200, 255, 0.7)'; for (let i = 0; i < 30; i++) { let rainX = Math.random() * canvas.width; let rainY = (Date.now() * 0.1 + i * 100) % canvas.height; ctx.fillRect(rainX, rainY, 1, 5); }}

        // Sol
        ctx.fillStyle = '#666'; ctx.fillRect(0, groundY, canvas.width, 70); 
        
        // Personnages Fond
        backgroundCharacters.forEach(char => { char.update(); if (char.x + char.w < 0) char.x = canvas.width + Math.random() * 50; });
        
        // Paillettes
        for (let i = particles.length - 1; i >= 0; i--) { let p = particles[i]; p.update(); p.draw(); if (p.life <= 0) particles.splice(i, 1); }
        
        player.update(); // Joueur

        // Timers apparition
        obstacleTimer++; collectibleTimer++; 
        // Le spawn de powerup est géré par le score maintenant

        let spawnInterval = Math.max(OBSTACLE_SPAWN_INTERVAL - (gameSpeed * 5), 45); 
        
        // Apparition Obstacles
        if (obstacleTimer > spawnInterval && obstacleImages.length > 0) { 
            const cactusImg = obstacleImages[Math.floor(Math.random() * obstacleImages.length)];
            let w = 50; let h = (cactusImg.height / cactusImg.width) * w; if (h > 80) { h = 80; w = (cactusImg.width / cactusImg.height) * h; } 
            obstacles.push(new Obstacle(canvas.width, groundY - h, cactusImg, w, h));
            if (Math.random() < 0.1) { 
                 const cactusImg2 = obstacleImages[Math.floor(Math.random() * obstacleImages.length)]; let w2 = 40; let h2 = (cactusImg2.height / cactusImg2.width) * w2; if (h2 > 60) h2 = 60;
                 obstacles.push(new Obstacle(canvas.width + w + 90 + Math.random() * 60, groundY - h2, cactusImg2, w2, h2)); 
            }
            obstacleTimer = 0 - (Math.random() * 20); 
        }
        
        // Apparition Collectibles
        if (collectibleTimer > 200 && collectibleImages.length > 0) { const noteImg = collectibleImages[0]; const y = groundY - 120 - (Math.random() * 100); collectibles.push(new Collectible(canvas.width, y, noteImg, 30, 30)); collectibleTimer = 0; }

        // Apparition Power-Ups (basée sur score)
        if (canSpawnPowerUp && !isPowerUpActive && Object.keys(powerUpImages).length > 0) {
             if (Math.random() < 0.05) { // Chance de pop une fois le seuil atteint
                 const types = Object.keys(powerUpImages); 
                 const randomType = types[Math.floor(Math.random() * types.length)]; 
                 const y = groundY - 80 - (Math.random() * 80); 
                 const newPowerUp = new PowerUp(canvas.width, y, randomType); 
                 if (newPowerUp && newPowerUp.image) {
                     powerUps.push(newPowerUp);
                     canSpawnPowerUp = false; 
                     console.log("Power-Up apparu:", randomType);
                 }
             }
        }

        // Màj & Collisions Power-Ups
        for (let i = powerUps.length - 1; i >= 0; i--) { 
            let pu = powerUps[i]; pu.update(); 
            if (player.x < pu.x + pu.w && player.x + player.w > pu.x && player.y < pu.y + pu.h && player.y + player.h > pu.y) { 
                 activatePowerUp(pu.type); 
                 for(let k=0; k<10; k++) player.emitParticles('#FFD700'); 
                 powerUps.splice(i, 1); 
            } else if (pu.x + pu.w < 0) powerUps.splice(i, 1); 
        }
        
        // Collisions Collectibles
        for (let i = collectibles.length - 1; i >= 0; i--) { 
            let coll = collectibles[i]; coll.update(); 
            if (player.x < coll.x + coll.w && player.x + player.w > coll.x && player.y < coll.y + coll.h && player.y + player.h > coll.y) { 
                 updateScore(10); 
                 for(let k=0; k<5; k++) player.emitParticles(); 
                 collectibles.splice(i, 1); 
            } else if (coll.x + coll.w < 0) collectibles.splice(i, 1); 
        }
        
        // Collisions Obstacles
        for (let i = obstacles.length - 1; i >= 0; i--) { 
             let obs = obstacles[i]; obs.update(); 
             if (!player.isInvincible) {
                 const playerHitbox = {x: player.x + 5, y: player.y + 5, w: player.w - 10, h: player.h - 10}; 
                 const obsHitbox = {x: obs.x + 5, y: obs.y + 5, w: obs.w - 10, h: obs.h - 10}; 
                 if (playerHitbox.x < obsHitbox.x + obsHitbox.w && playerHitbox.x + playerHitbox.w > obsHitbox.x && playerHitbox.y < obs.y + obs.h && playerHitbox.y + playerHitbox.h > obs.y) { 
                      endGame(); return; 
                 } 
             }
             if (obs.x + obs.w < 0) { obstacles.splice(i, 1); updateScore(1); } 
        }
        
        // Timer Bonus Actif
        if (isPowerUpActive) {
             powerUpTimer -= deltaTime; 
             powerUpTimerEl.innerText = `Temps restant: ${Math.max(0, powerUpTimer).toFixed(1)}s`;
             if (powerUpTimer <= 0) {
                 deactivatePowerUp();
             }
        }
        
        gameSpeed += 0.003; 
        
        if (!isGameOver) gameLoopId = requestAnimationFrame(gameLoop);
    }

    // Update Score (vérifie seuil bonus)
    function updateScore(value = 1) { 
        const oldScore = Math.floor(score);
        score += value; 
        const newScore = Math.floor(score);
        scoreEl.innerText = `Score: ${newScore}`; 

        if (!isPowerUpActive && !canSpawnPowerUp && newScore >= nextPowerUpScoreThreshold) {
            canSpawnPowerUp = true;
            console.log("Seuil de score atteint ! Bonus possible.");
        }
    }

    // --- Fin de partie ---
    function endGame() { 
        if (isGameOver) return; 
        isGameOver = true; if (gameLoopId) { cancelAnimationFrame(gameLoopId); gameLoopId = null; }
        deactivatePowerUp(); 
        if (currentMusic) { currentMusic.pause(); currentMusic.currentTime = 0; }
        finalScoreEl.innerText = Math.floor(score); gameOverScreenEl.style.display = 'flex'; 
        gameContainer.classList.add('shake'); setTimeout(() => { gameContainer.classList.remove('shake'); }, 300);
    }

    // --- 'resetGame' retourne au menu ---
    async function resetGame() { 
        isGameOver = true; 
        await initMenu(); 
    }
    
    // --- 'handleInput' gère tous les taps ---
    async function handleInput(e) { 
        if(e) e.preventDefault();
        if (!isReady) return; 
        if (isGameOver) {
            await resetGame(); 
        } else {
            if (!gameLoopId) { startGame(); }
            player.jump(); 
        }
    }
    
    // Écouteurs d'événements
    window.addEventListener('touchstart', handleInput, { passive: false });
    window.addEventListener('mousedown', handleInput);
    
    // Lancement initial (vers le menu)
    initMenu();
});
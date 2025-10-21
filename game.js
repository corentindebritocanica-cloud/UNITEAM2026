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
    // --- AJOUT V1.6 : Logique d'apparition des bonus par score ---
    let canSpawnPowerUp = false; // Flag pour autoriser l'apparition
    let nextPowerUpScoreThreshold = 30; // Seuil pour le prochain bonus
    const POWERUP_SCORE_INTERVAL = 20; // Points à marquer entre les bonus
    
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
    function loadGameImages() { /* ... (inchangée) ... */ }

    // --- Classe Particule ---
    class Particle { /* ... (inchangée) ... */ }

    // --- CLASSE PLAYER ---
    class Player { /* ... (inchangée) ... */ }
    
    // --- CLASSE OBSTACLE ---
    class Obstacle { /* ... (inchangée) ... */ }

    // --- CLASSE COLLECTIBLE ---
    class Collectible { /* ... (inchangée) ... */ }

    // --- CLASSE POWERUP ---
    class PowerUp { /* ... (inchangée) ... */ }

     // --- CLASSE BACKGROUND CHARACTER ---
    class BackgroundCharacter { /* ... (inchangée) ... */ }

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
        // --- AJOUT V1.6 : Réinitialiser la logique des bonus ---
        canSpawnPowerUp = false; 
        nextPowerUpScoreThreshold = 30;

        scoreEl.innerText = 'Score: 0';
        powerUpTextEl.innerText = ''; powerUpTimerEl.innerText = '';

         if (playerHeadImages.length > 0) {
             playerHeadImages.forEach(headImage => { 
                 const scale = Math.random() * 0.3 + 0.3; 
                 backgroundCharacters.push(new BackgroundCharacter(headImage, scale));
             });
             backgroundCharacters.sort((a, b) => a.scale - b.scale); 
         }
    }

    // --- 'initMenu' prépare le menu ---
    async function initMenu() { /* ... (inchangée) ... */ }

    // --- Démarrage du jeu ---
    function startGame() { /* ... (inchangée) ... */ }

    // --- Fonctions PowerUp (Modifiée) ---
    function activatePowerUp(type) {
        if (isPowerUpActive) return; 
        isPowerUpActive = true; activePowerUp = type; powerUpTimer = powerUpDuration; 
        // --- AJOUT V1.6 : Empêche un nouveau spawn tant que celui-ci est actif ---
        canSpawnPowerUp = false; 

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
        // --- AJOUT V1.6 : Définit le seuil pour le prochain bonus ---
        nextPowerUpScoreThreshold = Math.floor(score) + POWERUP_SCORE_INTERVAL; 
        console.log("Prochain bonus possible à partir de score :", nextPowerUpScoreThreshold);
    }
    
    // --- Boucle de jeu principale ---
    let lastTime = 0; 
    let obstacleTimer = 0; let collectibleTimer = 150; 
    const OBSTACLE_SPAWN_INTERVAL = 100; 

    function gameLoop(currentTime) { 
        if (isGameOver) { cancelAnimationFrame(gameLoopId); gameLoopId = null; return; }

        const deltaTime = (currentTime - lastTime) / 1000 || 0; 
        lastTime = currentTime;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Cycle Jour/Nuit & Météo
        // ... (inchangé) ...

        // Sol
        ctx.fillStyle = '#666'; ctx.fillRect(0, groundY, canvas.width, 70); 
        
        // Personnages Fond
        backgroundCharacters.forEach(char => { char.update(); if (char.x + char.w < 0) char.x = canvas.width + Math.random() * 50; });
        
        // Paillettes
        for (let i = particles.length - 1; i >= 0; i--) { let p = particles[i]; p.update(); p.draw(); if (p.life <= 0) particles.splice(i, 1); }
        
        player.update(); // Joueur

        // Timers apparition
        obstacleTimer++; collectibleTimer++; 
        // powerUpSpawnTimer++; // Supprimé

        let spawnInterval = Math.max(OBSTACLE_SPAWN_INTERVAL - (gameSpeed * 5), 45); 
        
        // Apparition Obstacles
        if (obstacleTimer > spawnInterval && obstacleImages.length > 0) { /* ... (inchangé) ... */ }
        
        // Apparition Collectibles
        if (collectibleTimer > 200 && collectibleImages.length > 0) { /* ... (inchangé) ... */ }

        // --- AJOUT V1.6 : Apparition des Power-Ups (basée sur le score) ---
        // On vérifie si on *peut* en faire apparaître un et s'il n'y en a pas déjà un en cours
        if (canSpawnPowerUp && !isPowerUpActive && Object.keys(powerUpImages).length > 0) {
             // 5% de chance par frame de le faire apparaître (pour éviter qu'il pop instantanément)
             if (Math.random() < 0.05) { 
                 const types = Object.keys(powerUpImages); 
                 const randomType = types[Math.floor(Math.random() * types.length)]; 
                 const y = groundY - 80 - (Math.random() * 80); 
                 const newPowerUp = new PowerUp(canvas.width, y, randomType); 
                 if (newPowerUp && newPowerUp.image) {
                     powerUps.push(newPowerUp);
                     canSpawnPowerUp = false; // On a fait apparaître, on attend le prochain seuil
                     console.log("Power-Up apparu:", randomType);
                 }
             }
        }

        // Màj & Collisions Power-Ups
        for (let i = powerUps.length - 1; i >= 0; i--) { /* ... (inchangé) ... */ }
        
        // Collisions Collectibles
        for (let i = collectibles.length - 1; i >= 0; i--) { /* ... (inchangé) ... */ }
        
        // Collisions Obstacles
        for (let i = obstacles.length - 1; i >= 0; i--) { /* ... (inchangé) ... */ }
        
        // Timer Bonus Actif
        if (isPowerUpActive) { /* ... (inchangé) ... */ }
        
        gameSpeed += 0.003; 
        
        if (!isGameOver) gameLoopId = requestAnimationFrame(gameLoop);
    }

    // --- MODIFIÉ V1.6 : Vérifie si le seuil de score pour le bonus est atteint ---
    function updateScore(value = 1) { 
        const oldScore = Math.floor(score);
        score += value; 
        const newScore = Math.floor(score);
        scoreEl.innerText = `Score: ${newScore}`; 

        // Vérifie si on a atteint ou dépassé le seuil pour le prochain bonus
        if (!isPowerUpActive && !canSpawnPowerUp && newScore >= nextPowerUpScoreThreshold) {
            canSpawnPowerUp = true;
            console.log("Seuil de score atteint ! Bonus possible.");
        }
    }

    // --- Fin de partie ---
    function endGame() { /* ... (inchangée) ... */ }

    // --- 'resetGame' retourne au menu ---
    async function resetGame() { /* ... (inchangée) ... */ }
    
    // --- 'handleInput' gère tous les taps ---
    async function handleInput(e) { /* ... (inchangée) ... */ }
    
    // Écouteurs d'événements
    window.addEventListener('touchstart', handleInput, { passive: false });
    window.addEventListener('mousedown', handleInput);
    
    // Lancement initial (vers le menu)
    initMenu();
});
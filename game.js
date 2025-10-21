// Attendre que la page soit chargée
window.addEventListener('load', () => {
    console.log("Window loaded. Initializing game setup..."); 

    // Vérifications initiales des éléments HTML
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas ? canvas.getContext('2d') : null;
    const gameContainer = document.querySelector('.game-container');
    const scoreEl = document.getElementById('score');
    const startScreenEl = document.getElementById('startScreen');
    const gameOverScreenEl = document.getElementById('gameOverScreen');
    const finalScoreEl = document.getElementById('finalScore');
    const loadingText = document.getElementById('loadingText'); 
    const powerUpTextEl = document.getElementById('powerUpText');
    const powerUpTimerEl = document.getElementById('powerUpTimer');
    const adminBtn = document.getElementById('adminBtn');

    if (!canvas || !ctx || !gameContainer || !scoreEl || !startScreenEl || !gameOverScreenEl || !loadingText || !powerUpTextEl || !powerUpTimerEl || !adminBtn) {
         console.error("CRITICAL ERROR: One or more essential HTML elements are missing!");
         if(loadingText) loadingText.innerText = "Erreur: Interface HTML incomplète!";
         // Bloque l'exécution ici si des éléments manquent
         return; 
    }
    console.log("HTML elements verified.");

    // --- AJOUT V2.5 : Attacher l'écouteur Admin TÔT ---
    // Logique du bouton Admin
    function handleAdminClick(e) {
        if (e) e.stopPropagation(); // Empêche le jeu de démarrer/sauter
        console.log("Admin button clicked."); // DEBUG LOG
        const password = prompt("Mot de passe Administrateur :");
        if (password === "corentin") {
            console.log("Password correct, redirecting to admin.html"); // DEBUG LOG
            window.location.href = 'admin.html'; 
        } else if (password !== null) { 
            alert("Mot de passe incorrect.");
        } else {
            console.log("Admin prompt cancelled."); // DEBUG LOG
        }
    }
    // Attacher les écouteurs pour le bouton Admin dès que possible
    adminBtn.addEventListener('click', handleAdminClick);
    adminBtn.addEventListener('touchstart', (e) => { e.stopPropagation(); handleAdminClick(e); }, { passive: false }); 
    console.log("Admin button listeners attached.");
    // --- FIN AJOUT V2.5 ---
    
    console.log("Setting canvas dimensions..."); 
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
    let isPowerUpActive = false; 
    let powerUpTextTimeout = null; 
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
    // Utilise .png (minuscule)
    const powerUpImagePaths = {
        invincible: 'chapeau.png',
        superJump: 'botte.png',
        magnet: 'aimant.png'
    };
    
    let imagesLoadedCount = 0; 
    const allImagePaths = [
        ...obstacleImagePaths, ...playerImagePaths, ...collectibleImagePaths, 
        ...Object.values(powerUpImagePaths) 
    ];
    const totalImages = allImagePaths.length;
    console.log(`Attempting to load ${totalImages} images.`); 

    // Fonction pour charger TOUTES les images
    function loadGameImages() {
        console.log("Starting loadGameImages function..."); 
        return new Promise((resolve, reject) => { 
            // Check if already loaded
            if (imagesLoadedCount === totalImages && playerHeadImages.length > 0 && obstacleImages.length > 0) { 
                 console.log("Images already loaded."); resolve(); return; 
            }
            console.log("Resetting image arrays and counters for loading."); 
            imagesLoadedCount = 0; 
            playerHeadImages.length = 0; obstacleImages.length = 0; collectibleImages.length = 0;
            Object.keys(powerUpImages).forEach(key => delete powerUpImages[key]); 

            if (totalImages === 0) { console.log("No images to load."); resolve(); return; }
            
            let currentLoadAttemptCount = 0; 
            let errorOccurredInThisLoad = false; 

            allImagePaths.forEach((path, index) => {
                console.log(`Starting load for: ${path}`); 
                const img = new Image(); 
                // Important pour éviter problèmes de CORS si les images venaient d'ailleurs (pas le cas ici mais bonne pratique)
                // img.crossOrigin = "Anonymous"; 
                img.src = path;
                
                img.onload = () => {
                    if (errorOccurredInThisLoad) return; 
                    currentLoadAttemptCount++; 
                    imagesLoadedCount = currentLoadAttemptCount; 
                    console.log(`Image loaded successfully (${currentLoadAttemptCount}/${totalImages}): ${path}`); 
                    
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
                    
                    if (currentLoadAttemptCount === totalImages) { 
                        console.log("All images loaded successfully in this attempt!"); 
                        resolve(); 
                    }
                };

                img.onerror = (e) => { // Passer l'event pour plus d'infos potentielles
                    if (errorOccurredInThisLoad) return; 
                    errorOccurredInThisLoad = true; 
                    // Log plus détaillé
                    console.error(`!!!!!!!! IMAGE LOAD FAILED: ${path} !!!!!!!!`, e); 
                    reject(`Failed to load image: ${path}`); 
                };
            });
        });
    }

    // --- Classe Particule ---
    class Particle { /* ... (inchangée) ... */ }

    // --- CLASSE PLAYER ---
    class Player { /* ... (inchangée) ... */ }
    
    // --- CLASSE OBSTACLE ---
    class Obstacle { /* ... (inchangée) ... */ }

    // --- CLASSE COLLECTIBLE ---
    class Collectible { /* ... (inchangée) ... */ }

    // --- CLASSE POWERUP ---
    class PowerUp { /* ... (inchangée - taille 100px) ... */ }

     // --- CLASSE BACKGROUND CHARACTER ---
    class BackgroundCharacter { /* ... (inchangée) ... */ }

    // --- 'initGameData' prépare une nouvelle partie ---
    async function initGameData() { /* ... (inchangée) ... */ }

    // --- 'initMenu' prépare le menu ---
    async function initMenu() { 
        console.log("Initializing menu (initMenu)..."); 
        isReady = false; 
        loadingText.innerText = "Chargement..."; 
        // gameContainer.classList.remove('in-game'); // Logo fixe
        
        try {
            console.log("Calling initGameData from initMenu..."); 
            await initGameData(); 
            console.log("initGameData successful. Setting up menu screen..."); 
            gameOverScreenEl.style.display = 'none'; 
            startScreenEl.style.display = 'flex'; 
            isReady = true; 
            loadingText.innerText = "Appuyez pour commencer"; 
            console.log("Menu ready!"); 
        } catch (error) {
            console.error("CRITICAL ERROR during initMenu:", error); 
            // Affiche l'erreur plus clairement à l'utilisateur
            loadingText.innerHTML = `Erreur: ${error}.<br/>Vérifiez console (F12) & images !`; 
            loadingText.style.color = 'red'; // Met en rouge
            isReady = false; 
        }
    }

    // --- Démarrage du jeu ---
    function startGame() { 
        console.log(`Attempting startGame: gameLoopId=${gameLoopId}, isReady=${isReady}`); 
        if (gameLoopId || !isReady) return; 
        console.log("Starting game..."); 
        startScreenEl.style.display = 'none'; gameOverScreenEl.style.display = 'none';
        if (currentMusic) {
             var promise = currentMusic.play();
             if (promise !== undefined) promise.catch(e => console.warn("Music play blocked:", e)); 
        } else { console.warn("No music selected to play."); }
        lastTime = performance.now(); 
        gameLoopId = requestAnimationFrame(gameLoop);
        console.log("Game loop started."); 
    }

    // --- Fonctions PowerUp ---
    function activatePowerUp(type) { /* ... (inchangée) ... */ }
    function deactivatePowerUp() { /* ... (inchangée) ... */ }
    
    // --- Boucle de jeu principale ---
    let lastTime = 0; 
    let obstacleTimer = 0; let collectibleTimer = 150; 
    const OBSTACLE_SPAWN_INTERVAL = 100; 

    function gameLoop(currentTime) { 
        if (isGameOver) { console.log("Game loop stopping: isGameOver true."); cancelAnimationFrame(gameLoopId); gameLoopId = null; return; }

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
        
        // Joueur (avec vérification)
        if (player) { player.update(); } 
        else { console.error("Player undefined in gameLoop!"); endGame(); return; }

        // Timers apparition
        obstacleTimer++; collectibleTimer++; 
        
        let spawnInterval = Math.max(OBSTACLE_SPAWN_INTERVAL - (gameSpeed * 5), 45); 
        
        // Apparition Obstacles
        if (obstacleTimer > spawnInterval && obstacleImages.length > 0) { /* ... (inchangé) ... */ }
        
        // Apparition Collectibles
        if (collectibleTimer > 200 && collectibleImages.length > 0) { /* ... (inchangé) ... */ }

        // Apparition Power-Ups (basée sur score)
        if (canSpawnPowerUp && !isPowerUpActive && Object.keys(powerUpImages).length > 0) { /* ... (inchangé) ... */ }

        // Màj & Collisions Power-Ups
        for (let i = powerUps.length - 1; i >= 0; i--) { /* ... (inchangé) ... */ }
        
        // Collisions Collectibles
        for (let i = collectibles.length - 1; i >= 0; i--) { /* ... (inchangé) ... */ }
        
        // Collisions Obstacles
        for (let i = obstacles.length - 1; i >= 0; i--) { /* ... (inchangé) ... */ }
        
        // Timer Bonus Actif
        if (isPowerUpActive) { /* ... (inchangé) ... */ }
        
        gameSpeed += 0.003; 
        
        if (!isGameOver) { gameLoopId = requestAnimationFrame(gameLoop); } 
        else { console.log("Game ended within gameLoop, stopping loop."); gameLoopId = null; }
    }

    // --- Update Score ---
    function updateScore(value = 1) { /* ... (inchangée) ... */ }

    // --- Fin de partie ---
    function endGame() { /* ... (inchangée) ... */ }

    // --- 'resetGame' retourne au menu ---
    async function resetGame() { /* ... (inchangée) ... */ }
    
    // --- 'handleInput' gère tous les taps ---
    async function handleInput(e) { /* ... (inchangée) ... */ }
    
    // Écouteurs d'événements (bouton admin attaché plus tôt)
    console.log("Adding main input listeners..."); 
    window.addEventListener('touchstart', handleInput, { passive: false });
    window.addEventListener('mousedown', handleInput);
    
    // Lancement initial (vers le menu)
    console.log("Calling initMenu for initial load."); 
    initMenu();
});

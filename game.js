// Attendre que la page soit chargée
window.addEventListener('load', () => {
    console.log("Window loaded. Initializing game setup..."); // DEBUG LOG

    const canvas = document.getElementById('gameCanvas');
    if (!canvas) { console.error("Canvas element not found!"); return; } // Early exit if canvas missing
    const ctx = canvas.getContext('2d');
    
    const gameContainer = document.querySelector('.game-container');
    const scoreEl = document.getElementById('score');
    const startScreenEl = document.getElementById('startScreen');
    const gameOverScreenEl = document.getElementById('gameOverScreen');
    const finalScoreEl = document.getElementById('finalScore');
    const loadingText = document.getElementById('loadingText'); 
    
    const powerUpTextEl = document.getElementById('powerUpText');
    const powerUpTimerEl = document.getElementById('powerUpTimer');
    const adminBtn = document.getElementById('adminBtn');

    // Basic check for essential elements
    if (!scoreEl || !startScreenEl || !gameOverScreenEl || !loadingText || !powerUpTextEl || !powerUpTimerEl || !adminBtn) {
         console.error("One or more UI elements are missing from index.html!");
         // Optionally display an error to the user
         if(loadingText) loadingText.innerText = "Erreur: Interface incomplète!";
         return; 
    }
    
    console.log("Setting canvas dimensions..."); // DEBUG LOG
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
    // Utilise .PNG pour les power-ups
    const powerUpImagePaths = {
        invincible: 'chapeau.PNG',
        superJump: 'botte.PNG',
        magnet: 'aimant.PNG'
    };
    
    let imagesLoadedCount = 0; // Compteur global
    const allImagePaths = [
        ...obstacleImagePaths, ...playerImagePaths, ...collectibleImagePaths, 
        ...Object.values(powerUpImagePaths) 
    ];
    const totalImages = allImagePaths.length;
    console.log(`Attempting to load ${totalImages} images.`); // DEBUG LOG

    // Fonction pour charger TOUTES les images
    function loadGameImages() {
        console.log("Starting loadGameImages function..."); // DEBUG LOG
        return new Promise((resolve, reject) => { 
            // Check if already loaded correctly
            if (imagesLoadedCount === totalImages && playerHeadImages.length === playerImagePaths.length && obstacleImages.length === obstacleImagePaths.length && collectibleImages.length === collectibleImagePaths.length && Object.keys(powerUpImages).length === Object.keys(powerUpImagePaths).length) { 
                 console.log("Images already loaded from previous run."); // DEBUG LOG
                 resolve(); return; 
            }
            // Reset state for this load attempt
            console.log("Resetting image arrays and counters for loading."); // DEBUG LOG
            imagesLoadedCount = 0; 
            playerHeadImages.length = 0; obstacleImages.length = 0; collectibleImages.length = 0;
            Object.keys(powerUpImages).forEach(key => delete powerUpImages[key]); 

            if (totalImages === 0) {
                 console.log("No images to load."); // DEBUG LOG
                 resolve(); return;
            }
            
            let currentLoadAttemptCount = 0; // Local counter for this specific call
            let errorOccurredInThisLoad = false; 

            allImagePaths.forEach((path, index) => {
                console.log(`Starting load for: ${path}`); // DEBUG LOG
                const img = new Image(); 
                img.src = path;
                
                img.onload = () => {
                    // Don't process if an error already happened in this batch
                    if (errorOccurredInThisLoad) return; 
                    
                    currentLoadAttemptCount++; 
                    imagesLoadedCount = currentLoadAttemptCount; // Update global count
                    console.log(`Image loaded successfully (${currentLoadAttemptCount}/${totalImages}): ${path}`); // DEBUG LOG
                    
                    // Store image
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
                    
                    // Check if all images for THIS attempt are loaded
                    if (currentLoadAttemptCount === totalImages) { 
                        console.log("All images loaded successfully in this attempt!"); // DEBUG LOG
                        resolve(); 
                    }
                };

                img.onerror = () => {
                    // Stop processing further loads if one fails
                    if (errorOccurredInThisLoad) return; 
                    
                    errorOccurredInThisLoad = true; 
                    console.error(`!!!!!!!! IMAGE LOAD FAILED: ${path} !!!!!!!!`); // DEBUG LOG
                    // Reject the promise immediately
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
    async function initGameData() { 
        console.log("Initializing game data (initGameData)..."); // DEBUG LOG
        gameContainer.classList.remove('shake');
        if (currentMusic) { currentMusic.pause(); currentMusic.currentTime = 0; currentMusic = null; }
        const musicIndex = Math.floor(Math.random() * musicPaths.length);
        currentMusic = new Audio(musicPaths[musicIndex]); currentMusic.loop = true;
        
        // Load images (will resolve immediately if already loaded)
        console.log("Calling loadGameImages from initGameData..."); // DEBUG LOG
        await loadGameImages(); 
        console.log("loadGameImages finished."); // DEBUG LOG
        
        const randomIndex = Math.floor(Math.random() * playerHeadImages.length);
        selectedHeadImage = playerHeadImages.length > 0 ? playerHeadImages[randomIndex] : null;
        if (!selectedHeadImage) console.warn("No player head image selected!"); // DEBUG LOG

        gravity = 0.8;
        player = new Player(50, groundY - PLAYER_HEIGHT, PLAYER_WIDTH, PLAYER_HEIGHT, selectedHeadImage); 
        player.isGrounded = true;
        obstacles = []; collectibles = []; particles = []; powerUps = []; backgroundCharacters = [];
        score = 0; gameSpeed = 5; isGameOver = false; gameLoopId = null; 
        activePowerUp = null; powerUpTimer = 0; isPowerUpActive = false; 
        weatherEffect = null; weatherTimer = 0; 
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
         console.log("Game data initialized."); // DEBUG LOG
    }

    // --- 'initMenu' prépare le menu ---
    async function initMenu() { 
        console.log("Initializing menu (initMenu)..."); // DEBUG LOG
        isReady = false; 
        loadingText.innerText = "Chargement..."; 
        
        try {
            console.log("Calling initGameData from initMenu..."); // DEBUG LOG
            await initGameData(); 
            
            // If initGameData succeeded (images loaded)
            console.log("initGameData successful. Setting up menu screen..."); // DEBUG LOG
            gameOverScreenEl.style.display = 'none'; 
            startScreenEl.style.display = 'flex'; 
            isReady = true; 
            loadingText.innerText = "Appuyez pour commencer"; 
            console.log("Menu ready!"); // DEBUG LOG
        } catch (error) {
            console.error("CRITICAL ERROR during initMenu:", error); // DEBUG LOG
            loadingText.innerText = `Erreur: ${error}. Vérifiez console (F12).`; 
            isReady = false; // Prevent starting game
        }
    }

    // --- Démarrage du jeu ---
    function startGame() { 
        console.log(`Attempting startGame: gameLoopId=${gameLoopId}, isReady=${isReady}`); // DEBUG LOG
        if (gameLoopId || !isReady) return; 
        
        console.log("Starting game..."); // DEBUG LOG
        startScreenEl.style.display = 'none'; gameOverScreenEl.style.display = 'none';
        
        if (currentMusic) {
             var promise = currentMusic.play();
             if (promise !== undefined) promise.catch(e => console.warn("Music play blocked:", e)); // Use warn for blocked music
        } else {
             console.warn("No music selected to play."); // DEBUG LOG
        }
        
        lastTime = performance.now(); 
        gameLoopId = requestAnimationFrame(gameLoop);
        console.log("Game loop started."); // DEBUG LOG
    }

    // --- Fonctions PowerUp ---
    function activatePowerUp(type) { /* ... (inchangée) ... */ }
    function deactivatePowerUp() { /* ... (inchangée) ... */ }
    
    // --- Boucle de jeu principale ---
    let lastTime = 0; 
    let obstacleTimer = 0; let collectibleTimer = 150; 
    const OBSTACLE_SPAWN_INTERVAL = 100; 

    function gameLoop(currentTime) { 
        if (isGameOver) { 
             console.log("Game loop stopping because isGameOver is true."); // DEBUG LOG
             cancelAnimationFrame(gameLoopId); gameLoopId = null; return; 
        }

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
        else { console.error("Player undefined during gameLoop!"); endGame(); return; } // Should not happen if initMenu worked

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
        
        // Continue loop if game is not over
        if (!isGameOver) {
             gameLoopId = requestAnimationFrame(gameLoop);
        } else {
             console.log("Game ended within gameLoop, stopping recursion."); // DEBUG LOG
             gameLoopId = null;
        }
    }

    // --- Update Score ---
    function updateScore(value = 1) { 
        if (isGameOver) return; 
        const oldScore = Math.floor(score); score += value; const newScore = Math.floor(score);
        scoreEl.innerText = `Score: ${newScore}`; 
        if (!isPowerUpActive && !canSpawnPowerUp && newScore >= nextPowerUpScoreThreshold) {
            canSpawnPowerUp = true;
            console.log(`Score threshold ${nextPowerUpScoreThreshold} reached! Power-up can now spawn.`); // DEBUG LOG
        }
    }

    // --- Fin de partie ---
    function endGame() { 
        console.log("endGame called."); // DEBUG LOG
        if (isGameOver) { console.log("endGame called but already game over."); return; } 
        isGameOver = true; 
        if (gameLoopId) { 
             console.log("Cancelling animation frame:", gameLoopId); // DEBUG LOG
             cancelAnimationFrame(gameLoopId); 
             gameLoopId = null; 
        } else {
             console.log("endGame called but no active game loop ID found."); // DEBUG LOG
        }
        deactivatePowerUp(); 
        if (currentMusic) { currentMusic.pause(); currentMusic.currentTime = 0; }
        finalScoreEl.innerText = Math.floor(score); 
        gameOverScreenEl.style.display = 'flex'; 
        gameContainer.classList.add('shake'); 
        setTimeout(() => { gameContainer.classList.remove('shake'); }, 300);
        console.log("Game Over screen displayed."); // DEBUG LOG
    }

    // --- 'resetGame' retourne au menu ---
    async function resetGame() { 
        console.log("resetGame called."); // DEBUG LOG
        isGameOver = true; // Ensure game is marked as over before resetting
        await initMenu(); 
    }
    
    // --- 'handleInput' gère tous les taps ---
    async function handleInput(e) { 
        if(e) e.preventDefault();
        console.log(`handleInput: isReady=${isReady}, isGameOver=${isGameOver}, gameLoopId=${gameLoopId}`); // DEBUG LOG
        if (!isReady) { console.log("Input ignored: Game not ready."); return; } 

        if (isGameOver) {
            console.log("Input during Game Over: Calling resetGame."); // DEBUG LOG
            await resetGame(); 
        } else {
            if (!gameLoopId) { 
                 console.log("Input on Menu: Calling startGame."); // DEBUG LOG
                 startGame(); 
            }
             // Jump only if player exists (safety check)
            if (player) {
                 console.log("Input during gameplay: Calling player.jump."); // DEBUG LOG
                 player.jump(); 
            } else {
                 console.warn("Input during gameplay but player is undefined!"); // DEBUG LOG
            }
        }
    }
    
    // --- Logique du bouton Admin ---
    function handleAdminClick(e) { /* ... (inchangée) ... */ }
    
    // Écouteurs d'événements
    console.log("Adding event listeners..."); // DEBUG LOG
    window.addEventListener('touchstart', handleInput, { passive: false });
    window.addEventListener('mousedown', handleInput);
    adminBtn.addEventListener('click', handleAdminClick);
    adminBtn.addEventListener('touchstart', (e) => { e.stopPropagation(); handleAdminClick(e); }, { passive: false }); 
    
    // Lancement initial (vers le menu)
    console.log("Calling initMenu for initial load."); // DEBUG LOG
    initMenu();
});

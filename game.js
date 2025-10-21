// Attendre que la page soit chargée
window.addEventListener('load', () => {
    console.log("Window loaded. Initializing game setup..."); 

    const canvas = document.getElementById('gameCanvas');
    if (!canvas) { console.error("Canvas element not found!"); return; } 
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

    if (!scoreEl || !startScreenEl || !gameOverScreenEl || !loadingText || !powerUpTextEl || !powerUpTimerEl || !adminBtn) {
         console.error("One or more UI elements are missing from index.html!");
         if(loadingText) loadingText.innerText = "Erreur: Interface incomplète!";
         return; 
    }
    
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
    // --- CORRECTION V2.4 : Utilise .png (minuscule) pour correspondre à GitHub ---
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
            if (imagesLoadedCount === totalImages && playerHeadImages.length > 0 && obstacleImages.length > 0) { 
                 console.log("Images already loaded."); 
                 resolve(); return; 
            }
            console.log("Resetting image arrays and counters for loading."); 
            imagesLoadedCount = 0; 
            playerHeadImages.length = 0; obstacleImages.length = 0; collectibleImages.length = 0;
            Object.keys(powerUpImages).forEach(key => delete powerUpImages[key]); 

            if (totalImages === 0) {
                 console.log("No images to load."); 
                 resolve(); return;
            }
            
            let currentLoadAttemptCount = 0; 
            let errorOccurredInThisLoad = false; 

            allImagePaths.forEach((path, index) => {
                console.log(`Starting load for: ${path}`); 
                const img = new Image(); 
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

                img.onerror = () => {
                    if (errorOccurredInThisLoad) return; 
                    errorOccurredInThisLoad = true; 
                    console.error(`!!!!!!!! IMAGE LOAD FAILED: ${path} !!!!!!!!`); 
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
    async function initMenu() { /* ... (inchangée) ... */ }

    // --- Démarrage du jeu ---
    function startGame() { /* ... (inchangée) ... */ }

    // --- Fonctions PowerUp ---
    function activatePowerUp(type) { /* ... (inchangée) ... */ }
    function deactivatePowerUp() { /* ... (inchangée) ... */ }
    
    // --- Boucle de jeu principale ---
    let lastTime = 0; 
    let obstacleTimer = 0; let collectibleTimer = 150; 
    const OBSTACLE_SPAWN_INTERVAL = 100; 

    function gameLoop(currentTime) { /* ... (inchangée) ... */ }

    // --- Update Score ---
    function updateScore(value = 1) { /* ... (inchangée) ... */ }

    // --- Fin de partie ---
    function endGame() { /* ... (inchangée) ... */ }

    // --- 'resetGame' retourne au menu ---
    async function resetGame() { /* ... (inchangée) ... */ }
    
    // --- 'handleInput' gère tous les taps ---
    async function handleInput(e) { /* ... (inchangée) ... */ }
    
    // --- Logique du bouton Admin ---
    function handleAdminClick(e) { /* ... (inchangée) ... */ }
    
    // Écouteurs d'événements
    console.log("Adding event listeners..."); 
    window.addEventListener('touchstart', handleInput, { passive: false });
    window.addEventListener('mousedown', handleInput);
    adminBtn.addEventListener('click', handleAdminClick);
    adminBtn.addEventListener('touchstart', (e) => { e.stopPropagation(); handleAdminClick(e); }, { passive: false }); 
    
    // Lancement initial (vers le menu)
    console.log("Calling initMenu for initial load."); 
    initMenu();
});

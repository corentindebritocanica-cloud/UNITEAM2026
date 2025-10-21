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
        constructor(x, y, color) { /* ... (inchangée) ... */ }
        update() { /* ... (inchangée) ... */ }
        draw() { /* ... (inchangée) ... */ }
    }

    // --- CLASSE PLAYER ---
    class Player { /* ... (inchangée) ... */ }
    
    // --- CLASSE OBSTACLE ---
    class Obstacle { /* ... (inchangée) ... */ }

    // --- CLASSE COLLECTIBLE ---
    class Collectible { /* ... (inchangée) ... */ }

    // --- CLASSE POWERUP (Taille modifiée) ---
    class PowerUp { 
        constructor(x, y, type) {
            this.type = type; this.image = powerUpImages[type];
            if (!this.image || !this.image.width || !this.image.height) { 
                 console.warn(`Image pour power-up ${type} non chargée ou invalide.`); return null; 
            }
            // --- MODIFIÉ V2.0 : Taille ENCORE augmentée ---
            this.w = 100; // Encore plus large (était 80)
            this.h = (this.image.height / this.image.width) * this.w; 
            // --- FIN MODIFICATION ---
            this.x = x; this.y = y; this.initialY = y; this.angle = Math.random() * Math.PI * 2;
        }
        draw() { if (this.image) ctx.drawImage(this.image, this.x, this.y, this.w, this.h); }
        update() {
            this.x -= gameSpeed; this.angle += 0.05;
            this.y = this.initialY + Math.sin(this.angle) * 15; // Oscillation
            this.draw();
        }
    }

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

    // --- Update Score (vérifie seuil bonus) ---
    function updateScore(value = 1) { /* ... (inchangée) ... */ }

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
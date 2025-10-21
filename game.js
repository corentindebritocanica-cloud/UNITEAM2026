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

    // --- AJOUT V2.2 : Récupérer le bouton Admin ---
    const adminBtn = document.getElementById('adminBtn');
    
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
    // Utilise .png (minuscule) pour les power-ups
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

    // --- CLASSE POWERUP (Taille modifiée) ---
    class PowerUp { 
        constructor(x, y, type) { /* ... (inchangée - taille 100px) ... */ }
        draw() { /* ... (inchangée) ... */ }
        update() { /* ... (inchangée) ... */ }
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

    // --- Update Score ---
    function updateScore(value = 1) { /* ... (inchangée) ... */ }

    // --- Fin de partie ---
    function endGame() { /* ... (inchangée) ... */ }

    // --- 'resetGame' retourne au menu ---
    async function resetGame() { /* ... (inchangée) ... */ }
    
    // --- 'handleInput' gère tous les taps ---
    async function handleInput(e) { /* ... (inchangée) ... */ }
    
    // --- AJOUT V2.2 : Logique du bouton Admin ---
    function handleAdminClick(e) {
        e.stopPropagation(); // Empêche le jeu de démarrer si on clique sur le bouton
        const password = prompt("Mot de passe Administrateur :");
        if (password === "corentin") {
            // Redirige vers la page admin (assure-toi que admin.html existe)
            window.location.href = 'admin.html'; 
        } else if (password !== null) { // Si l'utilisateur n'a pas cliqué sur Annuler
            alert("Mot de passe incorrect.");
        }
    }
    
    // Écouteurs d'événements
    window.addEventListener('touchstart', handleInput, { passive: false });
    window.addEventListener('mousedown', handleInput);
    // --- AJOUT V2.2 : Écouteur pour le bouton Admin ---
    adminBtn.addEventListener('click', handleAdminClick);
    // Empêche le double tap sur mobile de lancer le jeu ET d'ouvrir l'admin
    adminBtn.addEventListener('touchstart', (e) => { e.stopPropagation(); handleAdminClick(e); }, { passive: false }); 
    
    // Lancement initial (vers le menu)
    initMenu();
});
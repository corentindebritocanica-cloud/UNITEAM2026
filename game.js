// Attendre que la page soit chargée
window.addEventListener('load', () => {

    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    
    const scoreEl = document.getElementById('score');
    const startScreenEl = document.getElementById('startScreen');
    const gameOverScreenEl = document.getElementById('gameOverScreen');
    const finalScoreEl = document.getElementById('finalScore');
    const loadingText = document.getElementById('loadingText'); 
    
    const level1Btn = document.getElementById('level1Btn');
    const level2Btn = document.getElementById('level2Btn');

    // --- MODIFICATION : Canvas en plein écran ---
    // On prend la taille totale de la fenêtre
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    // --- FIN MODIFICATION ---

    const musicPaths = [
        'music1.mp3', 'music2.mp3', 'music3.mp3', 'music4.mp3', 'music5.mp3'
    ];
    let currentMusic = null; 

    let player, obstacles, score, gameSpeed, gravity, isGameOver, gameLoopId;
    let isReady = false; 
    let gameMode = null; 

    const groundY = canvas.height - 70; // Position du sol

    const obstacleImages = [];
    const playerHeadImages = []; 
    let selectedHeadImage = null; 
    const PLAYER_WIDTH = 50; 
    const PLAYER_HEIGHT = 50; 

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
    const totalImages = obstacleImagePaths.length + playerImagePaths.length;

    // Fonction pour charger toutes les images
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
        });
    }

    // --- CLASSE PLAYER ---
    class Player {
        constructor(x, y, w, h, image) {
            this.x = x; this.y = y; this.w = w; this.h = h; this.image = image;
            this.dy = 0; 
            this.jumpPower = (gameMode === 1) ? 15 : 10; 
            this.isGrounded = false;
        }
        draw() {
            if (this.image) {
                ctx.drawImage(this.image, this.x, this.y, this.w, this.h);
            } else { 
                ctx.fillStyle = '#007bff';
                ctx.fillRect(this.x, this.y, this.w, this.h);
            }
        }
        update() {
            this.dy += gravity; 
            this.y += this.dy;

            if (gameMode === 1) {
                if (this.y + this.h > groundY) {
                    this.y = groundY - this.h; this.dy = 0; this.isGrounded = true;
                }
            } else if (gameMode === 2) {
                // --- CORRECTION BUG : Mort si on touche le plafond visuel ---
                if (this.y + this.h > groundY) { 
                    this.y = groundY - this.h; endGame();
                }
                if (this.y < 10) { // Le plafond est à 10px de haut
                    this.y = 10; endGame();
                }
                // --- FIN CORRECTION ---
            }
            this.draw();
        }
        jump() {
            if (gameMode === 1 && this.isGrounded) { 
                this.dy = -this.jumpPower; 
                this.isGrounded = false; 
            } else if (gameMode === 2) { 
                this.dy = -this.jumpPower; 
            }
        }
    }
    
    // --- CLASSE OBSTACLE (MODIFIÉE) ---
    class Obstacle {
        // Ajout de 'isInverted' pour savoir s'il faut le dessiner à l'envers
        constructor(x, y, image, w, h, isInverted = false) { 
            this.x = x; this.y = y; this.w = w || image.width; this.h = h || image.height;
            this.image = image; 
            this.isInverted = isInverted; // Stocker l'état
        }
        
        draw() {
            // --- CORRECTION BUG : Logique de dessin pour les obstacles inversés ---
            if (this.isInverted) {
                ctx.save();
                ctx.translate(this.x, this.y + this.h); // Aller au coin bas-gauche
                ctx.scale(1, -1); // Inverser l'axe Y
                ctx.drawImage(this.image, 0, 0, this.w, this.h); // Dessiner l'image
                ctx.restore(); // Rétablir le canvas
            } else {
                ctx.drawImage(this.image, this.x, this.y, this.w, this.h); // Dessin normal
            }
            // --- FIN CORRECTION ---
        }
        
        update() { this.x -= gameSpeed; this.draw(); }
    }

    // --- Initialisation (retour au menu) ---
    async function init() { 
        isReady = false; 
        loadingText.innerText = "Chargement..."; 
        level1Btn.style.display = 'none'; 
        level2Btn.style.display = 'none';

        if (currentMusic) {
            currentMusic.pause();
            currentMusic.currentTime = 0;
            currentMusic = null;
        }

        gameMode = null;
        obstacles = [];
        score = 0;
        gameSpeed = 5; 
        isGameOver = false;

        scoreEl.innerText = 'Score: 0';
        gameOverScreenEl.style.display = 'none';
        startScreenEl.style.display = 'flex';
        
        await loadGameImages();

        isReady = true; 
        loadingText.innerText = "Choisis ton niveau :"; 
        level1Btn.style.display = 'block'; 
        level2Btn.style.display = 'block';
    }

    // --- Démarrage du jeu (après choix du niveau) ---
    function startGame(level) {
        if (!isReady || gameLoopId) return; 

        gameMode = level; 
        startScreenEl.style.display = 'none';

        const musicIndex = Math.floor(Math.random() * musicPaths.length);
        currentMusic = new Audio(musicPaths[musicIndex]);
        currentMusic.loop = true;
        var promise = currentMusic.play();
        if (promise !== undefined) promise.catch(e => console.log("Musique bloquée"));

        const randomIndex = Math.floor(Math.random() * playerHeadImages.length);
        selectedHeadImage = playerHeadImages.length > 0 ? playerHeadImages[randomIndex] : null;

        if (gameMode === 1) { 
            gravity = 0.8;
            player = new Player(50, groundY - PLAYER_HEIGHT, PLAYER_WIDTH, PLAYER_HEIGHT, selectedHeadImage); 
            player.isGrounded = true;
        } else if (gameMode === 2) { 
            gravity = 0.6; 
            player = new Player(50, canvas.height / 2, PLAYER_WIDTH, PLAYER_HEIGHT, selectedHeadImage); 
        }
        
        gameLoopId = requestAnimationFrame(gameLoop);
        window.addEventListener('touchstart', handleTap, { passive: false });
        window.addEventListener('mousedown', handleTap);
    }

    // --- Boucle de jeu principale ---
    let obstacleTimer = 0; 
    const OBSTACLE_SPAWN_INTERVAL = 90; 

    function gameLoop() {
        if (isGameOver) return; 

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        // Sol
        ctx.fillStyle = '#666';
        ctx.fillRect(0, groundY, canvas.width, 70); 
        // Plafond (juste pour le visuel du mode Flappy)
        if (gameMode === 2) {
             ctx.fillStyle = '#666';
             ctx.fillRect(0, 0, canvas.width, 10); // Ligne au plafond
        }
        
        player.update(); 

        obstacleTimer++;
        
        let spawnInterval = Math.max(OBSTACLE_SPAWN_INTERVAL - (gameSpeed * 5), 40); 
        
        if (obstacleTimer > spawnInterval && obstacleImages.length > 0) { 
            const cactusImg = obstacleImages[Math.floor(Math.random() * obstacleImages.length)];
            
            if (gameMode === 1) {
                let w = 50; 
                let h = (cactusImg.height / cactusImg.width) * w;
                if (h > 80) { h = 80; w = (cactusImg.width / cactusImg.height) * h; }
                obstacles.push(new Obstacle(canvas.width, groundY - h, cactusImg, w, h));

            } else if (gameMode === 2) {
                // --- CORRECTION BUG : Logique de création d'obstacles Flappy ---
                const gapHeight = 180; 
                const minHeight = 40; 
                const maxGapY = groundY - minHeight - gapHeight; 
                
                const gapY = Math.floor(Math.random() * (maxGapY - minHeight)) + minHeight;

                const topObstacleHeight = gapY;
                const bottomObstacleHeight = groundY - (gapY + gapHeight);
                const bottomObstacleY = gapY + gapHeight;
                
                // Obstacle du haut (à y=0, avec 'isInverted = true')
                let wTop = 60;
                let hTop = topObstacleHeight;
                obstacles.push(new Obstacle(canvas.width, 0, cactusImg, wTop, hTop, true)); // Passe 'true'

                // Obstacle du bas (normal)
                let wBottom = 60;
                let hBottom = bottomObstacleHeight;
                obstacles.push(new Obstacle(canvas.width, bottomObstacleY, cactusImg, wBottom, hBottom, false)); // Passe 'false'
                // --- FIN CORRECTION ---
            }
            
            obstacleTimer = 0 - (Math.random() * 20); 
        }

        // Mettre à jour et vérifier collisions
        for (let i = obstacles.length - 1; i >= 0; i--) {
            let obs = obstacles[i];
            obs.update();
            
            const playerHitbox = {
                x: player.x + 5, y: player.y + 5, w: player.w - 10, h: player.h - 10
            };
            const obsHitbox = {
                x: obs.x + 5, y: obs.y + 5, w: obs.w - 10, h: obs.h - 10
            };

            if (
                playerHitbox.x < obsHitbox.x + obsHitbox.w &&
                playerHitbox.x + playerHitbox.w > obsHitbox.x &&
                playerHitbox.y < obsHitbox.y + obsHitbox.h &&
                playerHitbox.y + playerHitbox.h > obsHitbox.y
            ) {
                endGame();
            }
            
            if (obs.x + obs.w < 0) {
                obstacles.splice(i, 1);
                if (gameMode === 1) updateScore(); 
                else if (gameMode === 2) updateScore(0.5); 
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
        
        window.removeEventListener('touchstart', handleTap);
        window.removeEventListener('mousedown', handleTap);
        
        if (currentMusic) {
            currentMusic.pause();
            currentMusic.currentTime = 0; 
        }
        
        finalScoreEl.innerText = Math.floor(score);
        gameOverScreenEl.style.display = 'flex';
    }

    // --- Contrôles ---
    
    async function handleRestart() {
        if (isGameOver) {
            await init(); 
        }
    }

    function handleTap(e) {
        if (e) e.preventDefault();
        if (player && !isGameOver) {
            player.jump();
        }
    }
    
    // --- Écouteurs d'événements ---
    
    level1Btn.addEventListener('click', () => startGame(1));
    level2Btn.addEventListener('click', () => startGame(2));
    level1Btn.addEventListener('touchstart', (e) => { e.preventDefault(); startGame(1); }, { passive: false });
    level2Btn.addEventListener('touchstart', (e) => { e.preventDefault(); startGame(2); }, { passive: false });

    gameOverScreenEl.addEventListener('touchstart', handleRestart, { passive: false });
    gameOverScreenEl.addEventListener('mousedown', handleRestart);
    
    // Lancement initial
    init();
});
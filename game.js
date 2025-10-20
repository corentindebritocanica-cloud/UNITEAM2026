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

    // --- AJOUT DES IMAGES JOUEUR ---
    const obstacleImages = [];
    const playerHeadImages = []; // Stocker les têtes ici
    let selectedHeadImage = null; // Tête choisie pour la partie
    const PLAYER_WIDTH = 50; // Taille fixe pour la tête (collision)
    const PLAYER_HEIGHT = 50; // Taille fixe pour la tête (collision)

    const obstacleImagePaths = [
        'cactus1.png',
        'cactus2.png',
        'cactus3.png',
        'cactus4.png' 
    ];

    // La liste de tes 18 têtes (RENOMMÉES EN .PNG !)
    const playerImagePaths = [
        'perso1.png', 'perso2.png', 'perso3.png', 'perso4.png', 'perso5.png',
        'perso6.png', 'perso7.png', 'perso8.png', 'perso9.png', 'perso10.png',
        'perso11.png', 'perso12.png', 'perso13.png', 'perso14.png', 'perso15.png',
        'perso16.png', 'perso17.png', 'perso18.png'
    ];
    // --- FIN AJOUT IMAGES JOUEUR ---

    let imagesLoadedCount = 0;
    const totalImages = obstacleImagePaths.length + playerImagePaths.length;

    // Fonction unique pour charger TOUTES les images (obstacles ET têtes)
    function loadGameImages() {
        return new Promise(resolve => {
            if (totalImages === 0) resolve();

            const loadImage = (path, targetArray) => {
                const img = new Image();
                img.src = path;
                img.onload = () => {
                    targetArray.push(img);
                    imagesLoadedCount++;
                    if (imagesLoadedCount === totalImages) {
                        console.log("Toutes les images (obstacles et têtes) chargées !");
                        resolve(); 
                    }
                };
                img.onerror = () => {
                    console.error(`Erreur de chargement de l'image : ${path}`);
                    imagesLoadedCount++; 
                    if (imagesLoadedCount === totalImages) {
                        resolve();
                    }
                };
            };

            obstacleImagePaths.forEach(path => loadImage(path, obstacleImages));
            playerImagePaths.forEach(path => loadImage(path, playerHeadImages));
        });
    }
    // --- FIN CHARGEMENT IMAGES ---

    // --- MODIFICATION CLASSE PLAYER ---
    class Player {
        constructor(x, y, w, h, image) {
            this.x = x; 
            this.y = y; 
            this.w = w; // Largeur pour la collision
            this.h = h; // Hauteur pour la collision
            this.image = image; // L'image de tête à dessiner

            this.dy = 0; 
            this.jumpPower = 15; 
            this.isGrounded = false;
        }

        draw() {
            // Dessine l'image de la tête
            if (this.image) {
                ctx.drawImage(this.image, this.x, this.y, this.w, this.h);
            } else {
                // Fallback si l'image n'est pas chargée (carré bleu)
                ctx.fillStyle = '#007bff';
                ctx.fillRect(this.x, this.y, this.w, this.h);
            }
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
    // --- FIN CLASSE PLAYER ---

    // --- CLASSE OBSTACLE (inchangée) ---
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
    // --- FIN CLASSE OBSTACLE ---

    async function init() { 
        isReady = false; 
        startTextEl.innerText = "Chargement..."; 

        // --- CHOIX ALÉATOIRE DE LA TÊTE ---
        // On ne recharge les images que si elles ne le sont pas déjà
        if (playerHeadImages.length === 0) { 
            console.log("Chargement des images...");
            await loadGameImages();
        }

        // Choisir une tête au hasard dans la liste
        const randomIndex = Math.floor(Math.random() * playerHeadImages.length);
        selectedHeadImage = playerHeadImages[randomIndex];
        // --- FIN CHOIX TÊTE ---

        // Créer le nouveau joueur avec l'image de tête choisie
        player = new Player(50, groundY - PLAYER_HEIGHT, PLAYER_WIDTH, PLAYER_HEIGHT, selectedHeadImage); 
        
        obstacles = [];
        score = 0;
        gameSpeed = 5;
        gravity = 0.8;
        isGameOver = false;

        scoreEl.innerText = 'Score: 0';
        gameOverScreenEl.style.display = 'none';
        startScreenEl.style.display = 'flex';
        
        music.pause();
        music.currentTime = 0;

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

        player.update(); // Mettre à jour la tête volante

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

            // Collision (w et h sont définis à 50x50 pour le joueur)
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

    function endGame() {
        if (isGameOver) return;
        
        isGameOver = true;
        cancelAnimationFrame(gameLoopId); 
        gameLoopId = null; 
        
        music.pause();
        music.currentTime = 0; 
        
        finalScoreEl.innerText = score;
        gameOverScreenEl.style.display = 'flex';
    }

    async function resetGame() {
        await init(); // Réinitialise et choisit une NOUVELLE tête au hasard
    }
    
    async function handleInput() {
        if (!isReady && !isGameOver) return; 

        if (isGameOver) {
            await resetGame(); 
        } else {
            if (!gameLoopId) {
                startGame();
            }
            player.jump();
        }
    }
    
    window.addEventListener('touchstart', handleInput, { passive: false });
    window.addEventListener('mousedown', handleInput);
    
    init(); // Lancement initial
});
// Attendre que la page soit chargée
window.addEventListener('load', () => {

    // Configuration de la zone de jeu (Canvas)
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    
    // Éléments de l'interface
    const scoreEl = document.getElementById('score');
    const startScreenEl = document.getElementById('startScreen');
    const gameOverScreenEl = document.getElementById('gameOverScreen');
    const finalScoreEl = document.getElementById('finalScore');

    // --- AJOUT MUSIQUE ---
    // Charger le fichier audio (assurez-vous qu'il est dans le même dossier)
    const music = new Audio('MONTAGE UNITEAM NOVEMBRE 2025.mp3'); 
    music.loop = true; // Pour que la musique tourne en boucle
    // --- FIN AJOUT MUSIQUE ---

    // Définir la taille du canvas en format portrait (ex: 9:16)
    // On prend 90% de la hauteur de l'écran comme base
    canvas.height = window.innerHeight * 0.9;
    canvas.width = canvas.height * (9 / 16);

    // Si le canvas est plus large que l'écran, on le réduit
    if (canvas.width > window.innerWidth * 0.95) {
        canvas.width = window.innerWidth * 0.95;
        canvas.height = canvas.width * (16 / 9);
    }

    // Paramètres du jeu
    let player, obstacles, score, gameSpeed, gravity, isGameOver;
    let gameLoopId; // Pour stocker l'ID de l'animation frame

    // Position du sol
    const groundY = canvas.height - 70; // 70px depuis le bas

    // Classe pour le joueur (le danseur)
    class Player {
        constructor(x, y, w, h, color) {
            this.x = x;
            this.y = y;
            this.w = w;
            this.h = h;
            this.color = color;

            this.dy = 0; // Vitesse verticale (delta y)
            this.jumpPower = 15;
            this.isGrounded = false;
        }

        draw() {
            ctx.fillStyle = this.color;
            ctx.fillRect(this.x, this.y, this.w, this.h);
        }

        update() {
            // Appliquer la gravité
            this.dy += gravity;
            this.y += this.dy;

            // Simuler le sol
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

    // Classe pour les obstacles
    class Obstacle {
        constructor(x, y, w, h, color) {
            this.x = x;
            this.y = y;
            this.w = w;
            this.h = h;
            this.color = color;
        }

        draw() {
            ctx.fillStyle = this.color;
            ctx.fillRect(this.x, this.y, this.w, this.h);
        }

        update() {
            this.x -= gameSpeed; // L'obstacle bouge vers la gauche
            this.draw();
        }
    }

    // Initialisation du jeu
    function init() {
        // Position initiale du joueur
        player = new Player(50, groundY - 50, 40, 40, '#007bff'); // Un carré bleu pour l'instant
        
        obstacles = [];
        score = 0;
        gameSpeed = 5;
        gravity = 0.8;
        isGameOver = false;

        // Réinitialiser l'interface
        scoreEl.innerText = 'Score: 0';
        gameOverScreenEl.style.display = 'none';
        startScreenEl.style.display = 'flex';
        
        // --- AJOUT MUSIQUE ---
        // S'assurer que la musique est en pause et au début
        music.pause();
        music.currentTime = 0;
        // --- FIN AJOUT MUSIQUE ---
    }

    // Fonction de démarrage (appelée par le premier tap)
    function startGame() {
        if (!gameLoopId) { // Ne démarre que si le jeu n'est pas déjà lancé
            startScreenEl.style.display = 'none';
            
            // --- AJOUT MUSIQUE ---
            // Démarrer la musique (les navigateurs l'autorisent car c'est après un "tap")
            music.play();
            // --- FIN AJOUT MUSIQUE ---
            
            gameLoopId = requestAnimationFrame(gameLoop);
        }
    }

    // Boucle de jeu principale
    let obstacleTimer = 0; // Compteur pour faire apparaître les obstacles
    
    function gameLoop() {
        if (isGameOver) return; // Arrêter la boucle si c'est fini

        // 1. Effacer l'écran
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // 2. Dessiner le sol
        ctx.fillStyle = '#666';
        ctx.fillRect(0, groundY, canvas.width, 70);

        // 3. Mettre à jour le joueur
        player.update();

        // 4. Gérer les obstacles
        obstacleTimer++;
        // Faire apparaître un obstacle toutes les X frames (ajustez 100 pour la difficulté)
        if (obstacleTimer > 100) {
            let obstacleHeight = Math.random() * 40 + 30; // Hauteur aléatoire
            let newObstacle = new Obstacle(canvas.width, groundY - obstacleHeight, 30, obstacleHeight, '#dc3545'); // Un carré rouge
            obstacles.push(newObstacle);
            obstacleTimer = 0;
        }

        // Mettre à jour et dessiner chaque obstacle
        for (let i = obstacles.length - 1; i >= 0; i--) {
            let obs = obstacles[i];
            obs.update();

            // Vérifier la collision
            if (
                player.x < obs.x + obs.w &&
                player.x + player.w > obs.x &&
                player.y < obs.y + obs.h &&
                player.y + player.h > obs.y
            ) {
                // Collision !
                endGame();
            }

            // Supprimer l'obstacle s'il sort de l'écran
            if (obs.x + obs.w < 0) {
                obstacles.splice(i, 1);
                // Augmenter le score quand on passe un obstacle
                updateScore();
            }
        }
        
        // Augmenter la vitesse progressivement
        gameSpeed += 0.003;

        // Continuer la boucle
        gameLoopId = requestAnimationFrame(gameLoop);
    }

    function updateScore() {
        score++;
        scoreEl.innerText = `Score: ${score}`;
    }

    function endGame() {
        isGameOver = true;
        cancelAnimationFrame(gameLoopId); // Arrête la boucle de jeu
        gameLoopId = null; // Réinitialise l'ID
        
        // --- AJOUT MUSIQUE ---
        // Arrêter la musique lors du Game Over
        music.pause();
        music.currentTime = 0; // Remet au début
        // --- FIN AJOUT MUSIQUE ---
        
        finalScoreEl.innerText = score;
        gameOverScreenEl.style.display = 'flex';
    }

    function resetGame() {
        init(); // Réinitialise toutes les variables
        // Le jeu redémarrera au prochain 'tap' grâce à la logique des listeners
    }


    // ==========================================================
    // == GESTION DES CONTRÔLES (TACTILE ET SOURIS) ==
    // ==========================================================

    // C'est la partie qui répond à votre demande :
    
    function handleInput() {
        if (isGameOver) {
            // Si le jeu est fini, le tap recommence le jeu
            resetGame();
        } else {
            // Si le jeu n'a pas commencé, il le démarre
            startGame();
            // Pendant le jeu, il fait sauter le joueur
            player.jump();
        }
    }
    
    // Écouteur pour le tactile
    window.addEventListener('touchstart', handleInput, { passive: false });
    
    // Écouteur pour la souris (pour tester sur ordinateur)
    window.addEventListener('mousedown', handleInput);

    // Lancer l'initialisation au chargement
    init();
});

document.addEventListener('DOMContentLoaded', () => {
    const gallery = document.getElementById('imageGallery');

    // Liste EXACTE de toutes les images utilisées dans le jeu (V2.2)
    const allImagePaths = [
        // Fond & Logo
        'FOND DE PLAN.jpg',
        'uniteamadventure.png',
        // Obstacles
        'cactus1.png', 'cactus2.png', 'cactus3.png', 'cactus4.png',
        // Collectible
        'note.png',
        // Power-ups (.png minuscule ici aussi, car c'est ce qu'on veut à terme)
        'chapeau.png', 'botte.png', 'aimant.png', 
        // Têtes Joueurs
        'perso1.png', 'perso2.png', 'perso3.png', 'perso4.png', 'perso5.png',
        'perso6.png', 'perso7.png', 'perso8.png', 'perso9.png', 'perso10.png',
        'perso11.png', 'perso12.png', 'perso13.png', 'perso14.png', 'perso15.png',
        'perso16.png', 'perso17.png', 'perso18.png'
    ];

    if (!gallery) {
        console.error("Élément 'imageGallery' non trouvé !");
        return;
    }

    allImagePaths.forEach(path => {
        const itemDiv = document.createElement('div');
        itemDiv.classList.add('image-item');

        const img = document.createElement('img');
        img.src = path; // Le navigateur cherche l'image

        const caption = document.createElement('p');
        caption.textContent = path; // Affiche le nom du fichier

        // Gestionnaire d'erreur si l'image ne se charge pas
        img.onerror = () => {
            console.error(`Impossible de charger : ${path}`);
            img.style.display = 'none'; // Cache l'icône d'image cassée
            caption.style.color = 'red';
            caption.style.fontWeight = 'bold';
            caption.textContent = `${path} (ERREUR)`;
             // Optionnel : Ajouter un message d'erreur plus visible
            // const errorMsg = document.createElement('div');
            // errorMsg.classList.add('error');
            // errorMsg.textContent = 'Erreur!';
            // itemDiv.appendChild(errorMsg);
        };
        
        // Gestionnaire de succès (optionnel, pour vérifier la taille par ex.)
        img.onload = () => {
             console.log(`Chargé avec succès : ${path}`);
             // Ici, tu pourrais ajouter des vérifications, par ex. si l'image est bien transparente
        };

        itemDiv.appendChild(img);
        itemDiv.appendChild(caption);
        gallery.appendChild(itemDiv);
    });
});
document.addEventListener('DOMContentLoaded', () => {
    const gallery = document.getElementById('imageGallery');

    // Liste EXACTE V2.5 (avec .png minuscule pour powerups)
    const allImagePaths = [
        // Fond & Logo
        'FOND DE PLAN.jpg',
        'uniteamadventure.png',
        // Obstacles
        'cactus1.png', 'cactus2.png', 'cactus3.png', 'cactus4.png',
        // Collectible
        'note.png',
        // Power-ups (.png MINUSCULE)
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
        img.src = path; 

        const caption = document.createElement('p');
        caption.textContent = path; 

        img.onerror = () => {
            console.error(`Impossible de charger : ${path}`);
            img.style.display = 'none'; 
            caption.style.color = 'red';
            caption.style.fontWeight = 'bold';
            caption.textContent = `${path} (ERREUR)`;
        };
        
        img.onload = () => {
             console.log(`Chargé avec succès : ${path}`);
        };

        itemDiv.appendChild(img);
        itemDiv.appendChild(caption);
        gallery.appendChild(itemDiv);
    });
});

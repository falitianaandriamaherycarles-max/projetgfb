// Gestion des données dynamiques
let data = {};

function initialiserDonnees() {
    // Données par défaut
    data = {
        "2021": [null, null, null, null, null, null, null, null, null, null, null, null],
        "2022": [null, null, null, null, null, null, null, null, null, null, null, null],
        "2023": [null, null, null, null, null, null, null, null, null, null, null, null],
        "2024": [null, null, null, null, null, null, null, null, null, null, null, null],
        "2025": [null, null, null, null, null, null, null, null, null, null, null, null]
    };
    rafraichirTableau();
}

function rafraichirTableau() {
    const tbody = document.getElementById('tableBody');
    tbody.innerHTML = '';
    
    const annees = Object.keys(data).sort();
    
    for (let i = 0; i < annees.length; i++) {
        const annee = annees[i];
        const row = tbody.insertRow();
        
        // Cellule année
        const cellAnnee = row.insertCell(0);
        cellAnnee.innerHTML = `<strong>${annee}</strong>`;
        cellAnnee.style.backgroundColor = '#f0f0f0';
        
        // Cellules mois
        for (let j = 0; j < 12; j++) {
            const cell = row.insertCell(j + 1);
            const input = document.createElement('input');
            input.type = 'number';
            input.step = 'any';
            input.value = data[annee][j] !== null ? data[annee][j] : '';
            input.onchange = (function(anneeKey, moisIndex) {
                return function(e) {
                    const val = e.target.value;
                    data[anneeKey][moisIndex] = val === '' ? null : parseFloat(val);
                };
            })(annee, j);
            cell.appendChild(input);
        }
    }
}

function ajouterLigne() {
    const annees = Object.keys(data).map(Number);
    let nouvelleAnnee = Math.max(...annees) + 1;
    
    if (data[nouvelleAnnee]) {
        nouvelleAnnee = nouvelleAnnee + 1;
    }
    
    data[nouvelleAnnee.toString()] = Array(12).fill(null);
    rafraichirTableau();
}

function supprimerDerniereLigne() {
    const annees = Object.keys(data).sort();
    if (annees.length > 1) {
        delete data[annees[annees.length - 1]];
        rafraichirTableau();
    } else {
        alert("Il doit rester au moins une année");
    }
}

function sauvegarderDonnees() {
    const formData = new FormData();
    formData.append('action', 'sauvegarder');
    formData.append('data', JSON.stringify(data));
    
    fetch('/', {
        method: 'POST',
        body: formData
    })
    .then(response => response.text())
    .then(html => {
        document.getElementById('resultContainer').innerHTML = 
            '<div class="success">Données sauvegardées avec succès!</div>';
        setTimeout(() => {
            location.reload();
        }, 2000);
    })
    .catch(error => {
        console.error('Erreur:', error);
        document.getElementById('resultContainer').innerHTML = 
            '<div class="error">Erreur lors de la sauvegarde</div>';
    });
}

function calculer() {
    const formData = new FormData();
    formData.append('action', 'calculer');
    formData.append('data', JSON.stringify(data));
    
    const sauvegardeAuto = document.getElementById('sauvegardeAuto').checked;
    formData.append('sauvegarde_auto', sauvegardeAuto);
    
    fetch('/', {
        method: 'POST',
        body: formData
    })
    .then(response => response.text())
    .then(html => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const results = doc.getElementById('resultContainer').innerHTML;
        document.getElementById('resultContainer').innerHTML = results;
    });
}

function chargerDonnees() {
    const annee = document.getElementById('anneeSelect').value;
    if (!annee) return;
    
    const formData = new FormData();
    formData.append('action', 'charger');
    formData.append('annee', annee);
    
    fetch('/', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(result => {
        if (result.data) {
            data = result.data;
            rafraichirTableau();
            document.getElementById('resultContainer').innerHTML = 
                '<div class="success">Données chargées avec succès!</div>';
        } else if (result.error) {
            alert('Erreur: ' + result.error);
        }
    });
}

function ajouterAnnee() {
    const nouvelleAnnee = document.getElementById('nouvelleAnnee').value;
    if (!nouvelleAnnee) {
        alert('Veuillez entrer une année');
        return;
    }
    
    const formData = new FormData();
    formData.append('annee', nouvelleAnnee);
    
    fetch('/ajouter_annee', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(result => {
        if (result.success) {
            location.reload();
        } else {
            alert('Erreur: ' + result.error);
        }
    });
}

function supprimerAnnee() {
    const annee = document.getElementById('anneeSupprimer').value;
    if (!annee) {
        alert('Veuillez sélectionner une année');
        return;
    }
    
    if (confirm(`Êtes-vous sûr de vouloir supprimer toutes les données de l'année ${annee} ?`)) {
        fetch(`/supprimer_annee/${annee}`, {
            method: 'DELETE'
        })
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                location.reload();
            } else {
                alert('Erreur: ' + result.error);
            }
        });
    }
}

function sauvegarder() {
    sauvegarderDonnees();
}

// Initialisation
initialiserDonnees();
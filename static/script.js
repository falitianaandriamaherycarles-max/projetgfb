// Variables globales
let data = {};

// Rafraîchir l'affichage du tableau
function rafraichirTableau() {
    const tbody = document.getElementById('tableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    const annees = Object.keys(data).sort();
    
    for (let i = 0; i < annees.length; i++) {
        const annee = annees[i];
        const row = tbody.insertRow();
        
        const cellAnnee = row.insertCell(0);
        cellAnnee.innerHTML = `<strong>${annee}</strong>`;
        cellAnnee.style.backgroundColor = '#f0f0f0';
        
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

// Charger les données d'une année
function chargerDonnees() {
    const annee = document.getElementById('anneeSelect').value;
    if (!annee) {
        alert('Veuillez sélectionner une année');
        return;
    }
    
    console.log(`Chargement de l'année ${annee}...`);
    
    const resultContainer = document.getElementById('resultContainer');
    resultContainer.innerHTML = '<div class="success">Chargement en cours...</div>';
    
    fetch(`/api/charger/${annee}`)
        .then(response => response.json())
        .then(result => {
            if (result.success && result.data) {
                data = result.data;
                rafraichirTableau();
                resultContainer.innerHTML = '<div class="success">✅ Données chargées avec succès!</div>';
                console.log("Données chargées:", data);
            } else {
                resultContainer.innerHTML = `<div class="error">❌ Erreur: ${result.error || 'Année non trouvée'}</div>`;
            }
        })
        .catch(error => {
            console.error('Erreur:', error);
            resultContainer.innerHTML = '<div class="error">❌ Erreur de connexion au serveur</div>';
        });
}

// Charger une période d'années (2-5 ans)
function chargerPeriode() {
    const anneeDebut = parseInt(document.getElementById('anneeDebut').value);
    const anneeFin = parseInt(document.getElementById('anneeFin').value);
    
    if (!anneeDebut || !anneeFin) {
        alert('Veuillez sélectionner la période');
        return;
    }
    
    if (anneeFin < anneeDebut) {
        alert('L\'année de fin doit être supérieure à l\'année de début');
        return;
    }
    
    const nbAnnees = anneeFin - anneeDebut + 1;
    
    if (nbAnnees < 2) {
        alert('Pour une analyse pertinente, sélectionnez au moins 2 années');
        return;
    }
    
    if (nbAnnees > 5) {
        if (!confirm(`Vous allez charger ${nbAnnees} années. Cela peut être long. Continuer ?`)) {
            return;
        }
    }
    
    console.log(`Chargement de la période ${anneeDebut} à ${anneeFin} (${nbAnnees} années)...`);
    
    const resultContainer = document.getElementById('resultContainer');
    resultContainer.innerHTML = `<div class="success">📥 Chargement de ${nbAnnees} années en cours...</div>`;
    
    // Appeler l'API pour charger la période
    fetch(`/api/charger_periode/${anneeDebut}/${anneeFin}`)
        .then(response => response.json())
        .then(result => {
            if (result.success && result.data) {
                data = result.data;
                rafraichirTableau();
                
                const nbAnneesChargees = Object.keys(data).length;
                const nbValeurs = Object.values(data).reduce((sum, mois) => 
                    sum + mois.filter(v => v && v !== '').length, 0);
                
                resultContainer.innerHTML = `
                    <div class="success">
                        ✅ Période chargée avec succès!<br>
                        📊 ${nbAnneesChargees} années chargées<br>
                        💰 ${nbValeurs} valeurs non nulles
                    </div>
                `;
                
                console.log("Période chargée:", data);
            } else {
                resultContainer.innerHTML = `<div class="error">❌ Erreur: ${result.error || 'Période non trouvée'}</div>`;
            }
        })
        .catch(error => {
            console.error('Erreur:', error);
            resultContainer.innerHTML = '<div class="error">❌ Erreur de connexion au serveur</div>';
        });
}

// Charger les N dernières années
function chargerDernieresAnnees(nbAnnees = 5) {
    console.log(`Chargement des ${nbAnnees} dernières années...`);
    
    const resultContainer = document.getElementById('resultContainer');
    resultContainer.innerHTML = `<div class="success">📥 Chargement des ${nbAnnees} dernières années...</div>`;
    
    fetch(`/api/charger_dernieres_annees/${nbAnnees}`)
        .then(response => response.json())
        .then(result => {
            if (result.success && result.data) {
                data = result.data;
                rafraichirTableau();
                
                resultContainer.innerHTML = `
                    <div class="success">
                        ✅ ${Object.keys(data).length} dernières années chargées avec succès!
                    </div>
                `;
            } else {
                resultContainer.innerHTML = `<div class="error">❌ Erreur: ${result.error}</div>`;
            }
        })
        .catch(error => {
            console.error('Erreur:', error);
            resultContainer.innerHTML = '<div class="error">❌ Erreur de connexion au serveur</div>';
        });
}

// Charger toutes les années disponibles
function chargerToutesAnnees() {
    if (!confirm('Charger toutes les années disponibles peut prendre du temps. Continuer ?')) {
        return;
    }
    
    console.log("Chargement de toutes les années...");
    
    const resultContainer = document.getElementById('resultContainer');
    resultContainer.innerHTML = '<div class="success">📥 Chargement de toutes les années...</div>';
    
    fetch('/api/charger_toutes_annees')
        .then(response => response.json())
        .then(result => {
            if (result.success && result.data) {
                data = result.data;
                rafraichirTableau();
                
                const nbAnnees = Object.keys(data).length;
                resultContainer.innerHTML = `
                    <div class="success">
                        ✅ ${nbAnnees} années chargées avec succès!
                    </div>
                `;
            } else {
                resultContainer.innerHTML = `<div class="error">❌ Erreur: ${result.error}</div>`;
            }
        })
        .catch(error => {
            console.error('Erreur:', error);
            resultContainer.innerHTML = '<div class="error">❌ Erreur de connexion au serveur</div>';
        });
}

// Sauvegarder les données
function sauvegarder() {
    console.log("Sauvegarde des données...");
    
    // Vérifier si des données existent
    let hasData = false;
    for (let annee in data) {
        for (let val of data[annee]) {
            if (val !== null && val !== '') {
                hasData = true;
                break;
            }
        }
    }
    
    if (!hasData) {
        alert("Aucune donnée à sauvegarder");
        return;
    }
    
    const resultContainer = document.getElementById('resultContainer');
    resultContainer.innerHTML = '<div class="success">Sauvegarde en cours...</div>';
    
    fetch('/api/sauvegarder', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data: data })
    })
    .then(response => response.json())
    .then(result => {
        if (result.success) {
            resultContainer.innerHTML = '<div class="success">✅ Données sauvegardées avec succès!</div>';
        } else {
            resultContainer.innerHTML = `<div class="error">❌ Erreur: ${result.error}</div>`;
        }
    })
    .catch(error => {
        console.error('Erreur:', error);
        resultContainer.innerHTML = '<div class="error">❌ Erreur lors de la sauvegarde</div>';
    });
}

// Calculer les statistiques
function calculer() {
    console.log("Calcul des statistiques...");
    
    const sauvegardeAuto = document.getElementById('sauvegardeAuto').checked;
    const resultContainer = document.getElementById('resultContainer');
    resultContainer.innerHTML = '<div class="success">Calcul en cours...</div>';
    
    fetch('/api/calculer', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
            data: data,
            sauvegarde_auto: sauvegardeAuto 
        })
    })
    .then(response => response.json())
    .then(result => {
        if (result.success) {
            const stats = result.resultat;
            let html = '<div class="results">';
            html += `<h3>Résultats de l'analyse</h3>`;
            html += `<p><strong>Moyenne générale:</strong> ${stats.moyenne_generale}</p>`;
            html += `<h4>Moyennes mensuelles:</h4><ul>`;
            stats.moyennes.forEach(m => html += `<li>${m}</li>`);
            html += `</ul><h4>Coefficients saisonniers:</h4><ul>`;
            stats.coefficients.forEach(c => html += `<li>${c}</li>`);
            html += `</ul>`;
            if (stats.sauvegarde) html += `<p><em>${stats.sauvegarde}</em></p>`;
            html += '</div>';
            resultContainer.innerHTML = html;
        } else {
            resultContainer.innerHTML = `<div class="error">❌ Erreur: ${result.error}</div>`;
        }
    })
    .catch(error => {
        console.error('Erreur:', error);
        resultContainer.innerHTML = '<div class="error">❌ Erreur lors du calcul</div>';
    });
}


// Initialisation au chargement
document.addEventListener('DOMContentLoaded', function() {
    
    // Mettre à jour la liste des années disponibles
    fetch('/api/annees')
        .then(response => response.json())
        .then(result => {
            if (result.success && result.annees) {
                const anneeSelect = document.getElementById('anneeSelect');
                const anneeSupprimer = document.getElementById('anneeSupprimer');
                
                // Vider les selects
                anneeSelect.innerHTML = '<option value="">Sélectionner une année</option>';

                // Ajouter les options
                result.annees.forEach(annee => {
                    anneeSelect.appendChild(new Option(annee, annee));
                });
            }
        });
});





function switchTab(tabName) {
    // Cacher tous les onglets
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Désactiver tous les boutons d'onglet
    document.querySelectorAll('.tab').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Afficher l'onglet sélectionné
    const selectedTab = document.getElementById(tabName);
    if (selectedTab) {
        selectedTab.classList.add('active');
    }
    
    // Activer le bouton cliqué
    if (event && event.target) {
        event.target.classList.add('active');
    }
    
    // Charger les données spécifiques à l'onglet
    if (tabName === 'crud') {
        chargerToutesDonneesCrud();
    } else if (tabName === 'dashboard') {
        chargerDashboard();
    }
}

// Fonction utilitaire pour détruire un graphique en toute sécurité
function destroyChartSafely(chart) {
    if (chart && typeof chart === 'object') {
        try {
            if (typeof chart.destroy === 'function') {
                chart.destroy();
            } else if (chart.data && typeof chart.clear === 'function') {
                chart.clear();
            }
        } catch (e) {
            console.warn('Erreur lors de la destruction du graphique:', e);
        }
    }
    return null;
}

function creerGraphiques(stats) {
    // Graphique d'évolution
    const canvas1 = document.getElementById('evolutionChart');
    if (!canvas1) {
        console.warn('Canvas evolutionChart non trouvé');
        return;
    }
    
    const ctx1 = canvas1.getContext('2d');
    if (ctx1 && stats.annees && stats.annees.length > 0) {
        // Destruction sécurisée
        evolutionChart = destroyChartSafely(evolutionChart);
        
        try {
            evolutionChart = new Chart(ctx1, {
                type: 'line',
                data: {
                    labels: stats.annees,
                    datasets: [{
                        label: 'Total annuel (€)',
                        data: stats.totaux_annuels,
                        borderColor: '#667eea',
                        backgroundColor: 'rgba(102, 126, 234, 0.1)',
                        tension: 0.4,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: {
                        legend: { position: 'top' },
                        title: { display: true, text: 'Évolution annuelle des revenus' }
                    }
                }
            });
        } catch (e) {
            console.error('Erreur création graphique évolution:', e);
            evolutionChart = null;
        }
    } else {
        console.log('Pas de données pour le graphique d\'évolution');
    }
    
    // Graphique de distribution
    const canvas2 = document.getElementById('distributionChart');
    if (!canvas2) {
        console.warn('Canvas distributionChart non trouvé');
        return;
    }
    
    const ctx2 = canvas2.getContext('2d');
    if (ctx2 && stats.moyennes_mensuelles && stats.moyennes_mensuelles.length > 0) {
        // Destruction sécurisée
        distributionChart = destroyChartSafely(distributionChart);
        
        try {
            distributionChart = new Chart(ctx2, {
                type: 'bar',
                data: {
                    labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'],
                    datasets: [{
                        label: 'Moyenne mensuelle (€)',
                        data: stats.moyennes_mensuelles,
                        backgroundColor: '#764ba2',
                        borderRadius: 5
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: {
                        legend: { position: 'top' },
                        title: { display: true, text: 'Distribution mensuelle moyenne' }
                    }
                }
            });
        } catch (e) {
            console.error('Erreur création graphique distribution:', e);
            distributionChart = null;
        }
    } else {
        console.log('Pas de données pour le graphique de distribution');
    }
}

// Version améliorée de chargerDashboard avec gestion d'erreurs
async function chargerDashboard() {
    try {
        const response = await fetch('/api/dashboard/stats');
        const result = await response.json();
        
        if (result.success) {
            const stats = result.data;
            
            const totalRevenus = document.getElementById('totalRevenus');
            const moyenneMensuelle = document.getElementById('moyenneMensuelle');
            const meilleurMois = document.getElementById('meilleurMois');
            const nbAnnees = document.getElementById('nbAnnees');
            
            if (totalRevenus) totalRevenus.textContent = `${stats.total.toLocaleString()} €`;
            if (moyenneMensuelle) moyenneMensuelle.textContent = `${Math.round(stats.moyenne_mensuelle).toLocaleString()} €`;
            if (meilleurMois) meilleurMois.textContent = stats.meilleur_mois ? `${stats.meilleur_mois.mois} ${stats.meilleur_mois.annee}` : '-';
            if (nbAnnees) nbAnnees.textContent = stats.nb_annees;
            
            // Créer les graphiques avec un petit délai pour s'assurer que le DOM est prêt
            setTimeout(() => {
                creerGraphiques(stats);
            }, 100);
        } else {
            console.error('Erreur API:', result.error);
            afficherMessage('Erreur lors du chargement des statistiques', 'error');
        }
    } catch (error) {
        console.error('Erreur chargement dashboard:', error);
        afficherMessage('Erreur de connexion au serveur', 'error');
    }
}

function getNomMois(mois) {
    const moisNoms = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 
                      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    return moisNoms[mois - 1] || mois;
}

function afficherMetriques(donnees) {
    const metricsGrid = document.getElementById('metricsGrid');
    if (!metricsGrid) return;
    
    if (!donnees || donnees.length === 0) {
        metricsGrid.innerHTML = `
            <div class="metric-card">
                <h3>Aucune donnée</h3>
                <div class="metric-value">0 €</div>
            </div>
        `;
        return;
    }
    
    const total = donnees.reduce((sum, r) => sum + r.valeur, 0);
    const moyenne = total / donnees.length;
    const maxRecord = donnees.reduce((max, r) => r.valeur > max.valeur ? r : max, donnees[0]);
    const anneesUniques = new Set(donnees.map(r => r.annee)).size;
    
    metricsGrid.innerHTML = `
        <div class="metric-card">
            <h3>Total général</h3>
            <div class="metric-value">${total.toLocaleString()} €</div>
        </div>
        <div class="metric-card">
            <h3>Moyenne par enregistrement</h3>
            <div class="metric-value">${Math.round(moyenne).toLocaleString()} €</div>
        </div>
        <div class="metric-card">
            <h3>Record maximum</h3>
            <div class="metric-value">${maxRecord.valeur.toLocaleString()} €</div>
            <small>${maxRecord.annee} - ${getNomMois(maxRecord.mois)}</small>
        </div>
        <div class="metric-card">
            <h3>Nombre d'années</h3>
            <div class="metric-value">${anneesUniques}</div>
        </div>
    `;
}




// ========== VARIABLES POUR LE CRUD SIMPLIFIÉ ==========
let crudData = {};  // Stocke toutes les données
let crudModified = false;  // Indique si des modifications ont été faites

// ========== CHARGEMENT INITIAL DES DONNÉES ==========
async function chargerToutesDonneesCrud() {
    console.log("Chargement de toutes les données...");
    
    try {
        const response = await fetch('/api/charger_toutes_annees');
        const result = await response.json();
        
        if (result.success && result.data) {
            crudData = result.data;
            afficherTableauCrud();
            mettreAJourStatsCrud();
            crudModified = false;
            console.log(`${Object.keys(crudData).length} années chargées`);
        } else {
            // Si aucune donnée, créer des années par défaut
            const defaultData = {};
            const currentYear = new Date().getFullYear();
            for (let i = -2; i <= 2; i++) {
                defaultData[currentYear + i] = Array(12).fill(null);
            }
            crudData = defaultData;
            afficherTableauCrud();
            mettreAJourStatsCrud();
        }
    } catch (error) {
        console.error('Erreur chargement:', error);
        document.getElementById('crudStats').innerHTML = '❌ Erreur de chargement';
    }
}

// ========== AFFICHAGE DU TABLEAU CRUD ==========
function afficherTableauCrud() {
    const tbody = document.getElementById('crudTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    const annees = Object.keys(crudData).sort();
    
    if (annees.length === 0) {
        tbody.innerHTML = '<tr><td colspan="14" style="text-align: center;">Aucune année. Cliquez sur "Ajouter une année" pour commencer.</td></tr>';
        return;
    }
    
    for (let i = 0; i < annees.length; i++) {
        const annee = annees[i];
        const row = tbody.insertRow();
        
        // Cellule Année
        const cellAnnee = row.insertCell(0);
        cellAnnee.innerHTML = `<strong style="font-size: 16px;">${annee}</strong>`;
        cellAnnee.style.backgroundColor = '#e3f2fd';
        cellAnnee.style.textAlign = 'center';
        
        // Cellules des 12 mois
        for (let j = 0; j < 12; j++) {
            const cell = row.insertCell(j + 1);
            const input = document.createElement('input');
            input.type = 'number';
            input.step = 'any';
            input.placeholder = '0';
            input.value = crudData[annee][j] !== null && crudData[annee][j] !== undefined ? crudData[annee][j] : '';
            
            input.style.width = '80px';
            input.style.padding = '6px';
            input.style.borderRadius = '4px';
            input.style.border = '1px solid #ced4da';
            input.style.textAlign = 'right';
            
            // Événement de modification
            input.onchange = (function(anneeKey, moisIndex) {
                return function(e) {
                    const val = e.target.value;
                    const newValue = val === '' ? null : parseFloat(val);
                    crudData[anneeKey][moisIndex] = newValue;
                    crudModified = true;
                    
                    // Marquer la cellule comme modifiée
                    e.target.style.backgroundColor = '#fff3cd';
                    e.target.style.borderColor = '#ffc107';
                    
                    // Mettre à jour les stats
                    mettreAJourStatsCrud();
                };
            })(annee, j);
            
            cell.appendChild(input);
        }
        
        // Cellule Actions (Supprimer l'année)
        const cellActions = row.insertCell(13);
        cellActions.style.textAlign = 'center';
        cellActions.style.backgroundColor = '#f8f9fa';
        cellActions.innerHTML = `
            <button onclick="supprimerAnneeCrud('${annee}')" class="btn btn-danger btn-sm" title="Supprimer cette année">🗑️ Supprimer</button>
        `;
    }
}

// ========== AJOUTER UNE ANNÉE ==========
function ajouterNouvelleAnneeCrud() {
    let nouvelleAnnee = prompt("Entrez l'année à ajouter :", new Date().getFullYear() + 1);
    
    if (!nouvelleAnnee) return;
    
    nouvelleAnnee = parseInt(nouvelleAnnee);
    
    if (isNaN(nouvelleAnnee)) {
        alert("Veuillez entrer une année valide");
        return;
    }
    
    if (crudData[nouvelleAnnee]) {
        alert(`L'année ${nouvelleAnnee} existe déjà !`);
        return;
    }
    
    // Ajouter l'année avec des valeurs vides
    crudData[nouvelleAnnee] = Array(12).fill(null);
    crudModified = true;
    
    // Recharger l'affichage
    afficherTableauCrud();
    mettreAJourStatsCrud();
    
    alert(`Année ${nouvelleAnnee} ajoutée avec succès. N'oubliez pas de sauvegarder !`);
}

// ========== SUPPRIMER UNE ANNÉE ==========
function supprimerAnneeCrud(annee) {
    if (confirm(`Êtes-vous sûr de vouloir supprimer l'année ${annee} ?`)) {
        delete crudData[annee];
        crudModified = true;
        afficherTableauCrud();
        mettreAJourStatsCrud();
        alert(`Année ${annee} supprimée. N'oubliez pas de sauvegarder !`);
    }
}

// ========== SAUVEGARDER TOUTES LES DONNÉES ==========
async function sauvegarderToutesDonneesCrud() {
    if (!crudModified && Object.keys(crudData).length > 0) {
        if (!confirm("Aucune modification détectée. Voulez-vous quand même sauvegarder ?")) {
            return;
        }
    }
    
    const resultContainer = document.getElementById('resultContainer');
    if (resultContainer) {
        resultContainer.innerHTML = '<div class="alert alert-success show">💾 Sauvegarde en cours...</div>';
    }
    
    try {
        const response = await fetch('/api/sauvegarder', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: crudData })
        });
        
        const result = await response.json();
        
        if (result.success) {
            crudModified = false;
            
            if (resultContainer) {
                resultContainer.innerHTML = '<div class="alert alert-success show">✅ Toutes les données ont été sauvegardées avec succès !</div>';
                setTimeout(() => {
                    resultContainer.innerHTML = '';
                }, 3000);
            }
            
            alert("Sauvegarde réussie !");
            
            // Recharger l'affichage pour enlever les marques de modification
            afficherTableauCrud();
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        console.error('Erreur sauvegarde:', error);
        if (resultContainer) {
            resultContainer.innerHTML = `<div class="alert alert-error show">❌ Erreur: ${error.message}</div>`;
        }
        alert("Erreur lors de la sauvegarde : " + error.message);
    }
}

// ========== STATISTIQUES ==========
function mettreAJourStatsCrud() {
    const statsSpan = document.getElementById('crudStats');
    if (!statsSpan) return;
    
    const annees = Object.keys(crudData);
    let totalValeurs = 0;
    let valeursRenseignees = 0;
    let totalSomme = 0;
    
    for (let annee of annees) {
        for (let val of crudData[annee]) {
            totalValeurs++;
            if (val !== null && val !== '' && !isNaN(val)) {
                valeursRenseignees++;
                totalSomme += parseFloat(val);
            }
        }
    }
    
    const tauxRemplissage = totalValeurs > 0 ? (valeursRenseignees / totalValeurs * 100).toFixed(1) : 0;
    const moyenne = valeursRenseignees > 0 ? (totalSomme / valeursRenseignees).toFixed(2) : 0;
    
    statsSpan.innerHTML = `
        📅 ${annees.length} année(s) | 
        📊 ${valeursRenseignees}/${totalValeurs} valeurs renseignées (${tauxRemplissage}%) | 
        💰 Moyenne: ${parseFloat(moyenne).toLocaleString()} AR
        ${crudModified ? ' | ⚠️ Modifications non sauvegardées' : ' | ✅ Toutes les modifications sont sauvegardées'}
    `;
    
    // Changer la couleur si modifications non sauvegardées
    if (crudModified) {
        statsSpan.style.color = '#ff9800';
        statsSpan.style.fontWeight = 'bold';
    } else {
        statsSpan.style.color = '';
        statsSpan.style.fontWeight = '';
    }
}

// ========== INITIALISATION ==========
// Surcharger l'initialisation existante
document.addEventListener('DOMContentLoaded', () => {
    console.log("Application démarrée - Mode CRUD simplifié");
    chargerToutesDonneesCrud();
});
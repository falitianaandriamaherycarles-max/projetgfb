// Variables globales
let data = {};

// ========== TABLEAU NON-EDITABLE POUR L'ANALYSE ==========
function rafraichirTableau() {
    const tbody = document.getElementById('tableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    const annees = Object.keys(data).sort();
    
    if (annees.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="14" style="text-align: center; padding: 40px; color: #6c757d; background: #f8f9fa;">
                    <i class="fa-solid fa-circle-info"></i> Aucune donnée disponible. Veuiller charger les données.
                  </td>
              </tr>
        `;
        return;
    }
    
    for (let i = 0; i < annees.length; i++) {
        const annee = annees[i];
        const row = tbody.insertRow();
        
        // Cellule année avec style
        const cellAnnee = row.insertCell(0);
        cellAnnee.innerHTML = `<strong>${annee}</strong>`;
        cellAnnee.style.backgroundColor = '#faf8e3';
        cellAnnee.style.fontWeight = 'bold';
        cellAnnee.style.textAlign = 'center';
        
        let totalAnnee = 0;
        
        // Cellules des mois (affichage texte, non éditable)
        for (let j = 0; j < 12; j++) {
            const cell = row.insertCell(j + 1);
            const valeur = data[annee][j];
            
            // Afficher la valeur formatée ou "-" si vide
            if (valeur !== null && valeur !== '' && !isNaN(valeur)) {
                const valeurNum = parseFloat(valeur);
                cell.innerHTML = `<span style="font-weight: 500; color: #2c3e50;">${valeurNum.toLocaleString()}</span>`;
                cell.style.textAlign = 'right';
                cell.style.padding = '8px';
                totalAnnee += valeurNum;
            } else {
                cell.innerHTML = '<span style="color: #999;">-</span>';
                cell.style.textAlign = 'center';
                cell.style.padding = '8px';
            }
            
            // Ajouter un style au survol
            cell.style.backgroundColor = i % 2 === 0 ? '#fafafa' : '#ffffff';
        }
        
        // Calculer la moyenne sur 12 mois (les mois vides = 0)
        const cellTotal = row.insertCell(13);
        const moyenneAnnee = totalAnnee / 12;
        
        // Cellule Moyenne Année - toujours avec 2 décimales
        if (moyenneAnnee > 0) {
            cellTotal.innerHTML = `<strong style="color: #E25;">${moyenneAnnee.toFixed(2).toLocaleString()} AR</strong>`;
        } else {
            cellTotal.innerHTML = '<span style="color: #999;">-</span>';
        }
        cellTotal.style.textAlign = 'right';
        cellTotal.style.padding = '8px';
        cellTotal.style.fontWeight = 'bold';
        cellTotal.style.backgroundColor = i % 2 === 0 ? '#faf8e3' : '#fff3e0';
        cellTotal.style.borderLeft = '2px solid #E25';
    }
}

// ========== FONCTIONS DE CHARGEMENT ==========
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
        if (!confirm(`Vous allez charger ${nbAnnees} années. Continuer ?`)) {
            return;
        }
    }
    
    console.log(`Chargement de la période ${anneeDebut} à ${anneeFin}...`);
    
    const resultContainer = document.getElementById('resultContainer');
    resultContainer.innerHTML = `<div class="success"><i class="fa-solid fa-spinner"></i> Chargement de ${nbAnnees} années en cours...</div>`;
    
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
                        <i class="fa-solid fa-check"></i> Période chargée avec succès!<br>
                        <i class="fa-solid fa-chart-column"></i> ${nbAnneesChargees} années chargées<br>
                        <i class="fa-solid fa-sack-dollar"></i> ${nbValeurs} valeurs non nulles
                    </div>
                `;
            } else {
                resultContainer.innerHTML = `<div class="error"><i class="fa-regular fa-circle-xmark"></i> Erreur: ${result.error || 'Période non trouvée'}</div>`;
            }
        })
        .catch(error => {
            console.error('Erreur:', error);
            resultContainer.innerHTML = '<div class="error"><i class="fa-regular fa-circle-xmark"></i> Erreur de connexion au serveur</div>';
        });
}

function chargerDernieresAnnees(nbAnnees = 5) {
    console.log(`Chargement des ${nbAnnees} dernières années...`);
    
    const resultContainer = document.getElementById('resultContainer');
    resultContainer.innerHTML = `<div class="success"><i class="fa-solid fa-spinner"></i> Chargement des ${nbAnnees} dernières années...</div>`;
    
    fetch(`/api/charger_dernieres_annees/${nbAnnees}`)
        .then(response => response.json())
        .then(result => {
            if (result.success && result.data) {
                data = result.data;
                rafraichirTableau();
                
                resultContainer.innerHTML = `
                    <div class="success">
                        <i class="fa-solid fa-check"></i> ${Object.keys(data).length} dernières années chargées avec succès!
                    </div>
                `;
            } else {
                resultContainer.innerHTML = `<div class="error"><i class="fa-regular fa-circle-xmark"></i> Erreur: ${result.error}</div>`;
            }
        })
        .catch(error => {
            console.error('Erreur:', error);
            resultContainer.innerHTML = '<div class="error"><i class="fa-regular fa-circle-xmark"></i> Erreur de connexion au serveur</div>';
        });
}

function chargerToutesAnnees() {
    if (!confirm('Charger toutes les années disponibles peut prendre du temps. Continuer ?')) {
        return;
    }
    
    console.log("Chargement de toutes les années...");
    
    const resultContainer = document.getElementById('resultContainer');
    resultContainer.innerHTML = '<div class="success"><i class="fa-solid fa-spinner"></i> Chargement de toutes les années...</div>';
    
    fetch('/api/charger_toutes_annees')
        .then(response => response.json())
        .then(result => {
            if (result.success && result.data) {
                data = result.data;
                rafraichirTableau();
                
                const nbAnnees = Object.keys(data).length;
                resultContainer.innerHTML = `
                    <div class="success">
                        <i class="fa-solid fa-check"></i> ${nbAnnees} années chargées avec succès!
                    </div>
                `;
            } else {
                resultContainer.innerHTML = `<div class="error"><i class="fa-regular fa-circle-xmark"></i> Erreur: ${result.error}</div>`;
            }
        })
        .catch(error => {
            console.error('Erreur:', error);
            resultContainer.innerHTML = '<div class="error"><i class="fa-regular fa-circle-xmark"></i> Erreur de connexion au serveur</div>';
        });
}


function calculer() {
    console.log("Calcul des statistiques...");
    
    if (Object.keys(data).length === 0) {
        alert("Aucune donnée chargée. Veuillez d'abord charger des données.");
        return;
    }
    
    const resultContainer = document.getElementById('resultContainer');
    resultContainer.innerHTML = '<div class="success">Calcul en cours...</div>';
    
    fetch('/api/calculer', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
            data: data,
        })
    })
    .then(response => response.json())
    .then(result => {
        if (result.success) {
            const stats = result.resultat;
            const moisNoms = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 
                              'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
            
            // Récupérer la dernière année de l'intervalle analysé
            const anneesAnalysees = Object.keys(data).sort();
            const derniereAnneeAnalysee = parseInt(anneesAnalysees[anneesAnalysees.length - 1]);
            const anneePrevision = derniereAnneeAnalysee + 1;
            
            // Calculer la prévision basée sur la dernière année analysée
            const prevision = calculerPrevisionAvecDerniereAnnee(stats, data, derniereAnneeAnalysee);
            
            // Calculer le total des coefficients saisonniers
            const totalCoefficients = stats.coefficients.reduce((sum, c) => sum + c, 0);
            const moyenneCoefficients = (totalCoefficients / 12).toFixed(2);
            
            // Calculer la moyenne annuelle
            const moyenneAnnuelle = stats.moyenne_generale * 12;
            
            let html = `
                <div class="results" style="margin-top: 20px; padding: 20px; background: #fff; border-radius: 8px;">
                    <h3 style="text-align: center; margin-bottom: 20px;"><i class="fa-solid fa-square-poll-vertical"></i> Résultats de l'analyse saisonnière</h3>
                    
                    <!-- Informations sur la période analysée -->
                    <div style="border-radius: 8px; padding: 10px 15px; margin-bottom: 20px; text-align: center;">
                        <strong><i class="fa-solid fa-calendar-check"></i> Période analysée :</strong> ${anneesAnalysees.join(' - ')} 
                        (${anneesAnalysees.length} année${anneesAnalysees.length > 1 ? 's' : ''})
                        <span style="margin-left: 15px;"><i class="fa-solid fa-crosshairs"></i> Prévision basée sur <strong>${derniereAnneeAnalysee}</strong></span>
                    </div>
                    
                    <!-- Tableau principal -->
                    <div style="background: white; border-radius: 8px; overflow-x: auto; margin-bottom: 20px;">
                        <table style="width: 100%; border-collapse: collapse; text-align: center;">
                            <thead>
                                <tr style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;">
                                    <th style="padding: 12px; border: 1px solid #dee2e6;">Mois</th>
                                    <th style="padding: 12px; border: 1px solid #dee2e6;">Moyenne mensuelle (AR)</th>
                                    <th style="padding: 12px; border: 1px solid #dee2e6;">Coefficient saisonnier</th>
                                    <th style="padding: 12px; border: 1px solid #dee2e6;">Interprétation</th>
                                    <th style="padding: 12px; border: 1px solid #e6e0de;">Prévision ${anneePrevision}</th>
                                </tr>
                            </thead>
                            <tbody>
            `;
            
            let totalPrevision = 0;
            
            for (let i = 0; i < 12; i++) {
                const moyenne = parseFloat(stats.moyennes[i]).toLocaleString();
                const coefficient = stats.coefficients[i];
                const previsionMois = prevision.moisPrevisions[i];
                totalPrevision += previsionMois;
                
                let interpretation = '';
                let interpretationColor = '';
                
                if (coefficient > 1.1) {
                    interpretation = '<i class="fa-solid fa-fire"></i> Période de forte activité';
                    interpretationColor = '#dc3545';
                } else if (coefficient > 1) {
                    interpretation = '<i class="fa-solid fa-arrow-trend-up"></i> Au-dessus de la moyenne';
                    interpretationColor = '#ff9800';
                } else if (coefficient < 0.9) {
                    interpretation = '<i class="fa-solid fa-snowflake"></i> Période de faible activité';
                    interpretationColor = '#28a745';
                } else if (coefficient < 1) {
                    interpretation = '<i class="fa-solid fa-arrow-trend-down"></i> En dessous de la moyenne';
                    interpretationColor = '#17a2b8';
                } else {
                    interpretation = '<i class="fa-solid fa-chart-column"></i> Moyenne saisonnière';
                    interpretationColor = '#6c757d';
                }
                
                // Alternance des couleurs de lignes
                const rowColor = i % 2 === 0 ? '#ffffff' : '#f8f9fa';
                
                html += `
                    <tr style="background-color: ${rowColor};">
                        <td style="padding: 10px; border: 1px solid #dee2e6; font-weight: bold; text-align: left;">
                            <i class="fa-solid fa-calendar-days"></i> ${moisNoms[i]}
                        </td>
                        <td style="padding: 10px; border: 1px solid #dee2e6; text-align: right; font-weight: 500;">
                            ${moyenne} AR
                        </td>
                        <td style="padding: 10px; border: 1px solid #dee2e6; text-align: center;">
                            <span style="background: ${coefficient > 1 ? '#fff3cd' : '#d1ecf1'}; 
                                         padding: 4px 8px; 
                                         border-radius: 20px; 
                                         font-weight: bold;
                                         color: ${coefficient > 1 ? '#856404' : '#0c5460'};">
                                ${coefficient}
                            </span>
                        </td>
                        <td style="padding: 10px; border: 1px solid #dee2e6; text-align: left;">
                            <span style="color: ${interpretationColor};">${interpretation}</span>
                        </td>
                        <td style="padding: 10px; border: 1px solid #e6dede; text-align: right; font-weight: bold; background: #faf8e3;color: #c0352b;">
                            ${previsionMois.toLocaleString()} AR
                        </td>
                    </tr>
                `;
            }
            
            // Lignes des totaux
            html += `
                            </tbody>
                            <tfoot>
                                <tr style="background-color: #faf8e3; font-weight: bold;">
                                    <td style="padding: 12px; border: 1px solid #dee2e6; text-align: left;">
                                        <i class="fa-solid fa-chart-column"></i> TOTAUX / MOYENNES
                                    </td>
                                    <td style="padding: 12px; border: 1px solid #dee2e6; text-align: right;">
                                        ${Math.round(moyenneAnnuelle).toLocaleString()} AR
                                    </td>
                                    <td style="padding: 12px; border: 1px solid #dee2e6; text-align: center;">
                                        <span style="background: #e8e8e8; padding: 4px 8px; border-radius: 20px; font-weight: bold;">
                                            Total: ${totalCoefficients.toFixed(2)} | Moy: ${moyenneCoefficients}
                                        </span>
                                    </td>
                                    <td style="padding: 12px; border: 1px solid #dee2e6; text-align: center; color: #E25;">
                                        <i class="fa-solid fa-check"></i> Moyenne général: ${parseFloat(stats.moyenne_generale).toLocaleString()} Ar/mois
                                    </td>
                                    <td style="padding: 12px; border: 1px solid #e6e2de; text-align: right; background: #faf8e3;">
                                        ${totalPrevision.toLocaleString()} AR
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                    
                    <!-- Section Prévision Annuelle -->
                    <div style="background: linear-gradient(135deg, #FFA62B 0%, #E25 100%); border-radius: 8px; padding: 20px; margin-bottom: 20px; color: white;">
                        <h3 style="margin-bottom: 15px;"><i class="fa-solid fa-align-left"></i> Prévision pour l'année ${anneePrevision}</h3>
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                            <div style="background: rgba(255,255,255,0.2); padding: 15px; border-radius: 8px; text-align: center;">
                                <div style="font-size: 14px; opacity: 0.9;">Basé sur l'année</div>
                                <div style="font-size: 28px; font-weight: bold;">${derniereAnneeAnalysee}</div>
                            </div>
                            <div style="background: rgba(255,255,255,0.2); padding: 15px; border-radius: 8px; text-align: center;">
                                <div style="font-size: 14px; opacity: 0.9;">Total prévisionnel</div>
                                <div style="font-size: 28px; font-weight: bold;">${totalPrevision.toLocaleString()} AR</div>
                            </div>
                            <div style="background: rgba(255,255,255,0.2); padding: 15px; border-radius: 8px; text-align: center;">
                                <div style="font-size: 14px; opacity: 0.9;">Moyenne mensuelle prévue</div>
                                <div style="font-size: 28px; font-weight: bold;">${Math.round(totalPrevision / 12).toLocaleString()} AR</div>
                            </div>
                            <div style="background: rgba(255,255,255,0.2); padding: 15px; border-radius: 8px; text-align: center;">
                                <div style="font-size: 14px; opacity: 0.9;">Mois le plus favorable</div>
                                <div style="font-size: 18px; font-weight: bold;"><i class="fa-solid fa-calendar-days"></i> ${prevision.meilleurMois}</div>
                                <div style="font-size: 14px;">${prevision.meilleureValeur.toLocaleString()} AR</div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Graphique comparatif -->
                    <div style="background: white; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                        <h4><i class="fa-solid fa-chart-column"></i> Prévisions mensuelles pour ${anneePrevision}</h4>
                        <canvas id="comparisonChart" style="max-height: 300px;"></canvas>
                    </div>
                </div>
            `;
            
            resultContainer.innerHTML = html;
            
 // Créer le graphique comparatif
            creerGraphiqueComparatif(moisNoms, prevision.valeursDerniereAnnee, prevision.moisPrevisions, derniereAnneeAnalysee, anneePrevision);
        } else {
            resultContainer.innerHTML = `<div class="error"><i class="fa-regular fa-circle-xmark"></i> Erreur: ${result.error}</div>`;
        }
    })
    .catch(error => {
        console.error('Erreur:', error);
        resultContainer.innerHTML = '<div class="error"><i class="fa-regular fa-circle-xmark"></i> Erreur lors du calcul</div>';
    });
}

// Fonction pour le graphique comparatif
function creerGraphiqueComparatif(moisNoms, valeursReelles, previsions, anneeReelle, anneePrevision) {
    const canvas = document.getElementById('comparisonChart');
    if (!canvas) return;
    
    if (window.comparisonChart && typeof window.comparisonChart.destroy === 'function') {
        try {
            window.comparisonChart.destroy();
        } catch(e) {}
    }
    
    const ctx = canvas.getContext('2d');
    
    window.comparisonChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: moisNoms,
            datasets: [
                {
                    label: `Année ${anneeReelle} (réel)`,
                    data: valeursReelles,
                    borderColor: '#FFA62B',
                    backgroundColor: 'rgba(255, 166, 43, 0.1)',
                    borderWidth: 3,
                    tension: 0.4,
                    fill: true,
                    pointRadius: 5,
                    pointHoverRadius: 7,
                    pointBackgroundColor: '#FFA62B',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2
                },
                {
                    label: `Prévision ${anneePrevision}`,
                    data: previsions,
                    borderColor: '#E25C2B',
                    backgroundColor: 'rgba(226, 92, 43, 0.1)',
                    borderWidth: 3,
                    borderDash: [5, 5],
                    tension: 0.4,
                    fill: true,
                    pointRadius: 5,
                    pointHoverRadius: 7,
                    pointBackgroundColor: '#E25C2B',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: ${context.raw.toLocaleString()} AR`;
                        }
                    }
                },
                legend: {
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        boxWidth: 10
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Montant (AR)',
                        font: { weight: 'bold' }
                    },
                    ticks: {
                        callback: function(value) {
                            return value.toLocaleString();
                        }
                    },
                    grid: {
                        color: 'rgba(0,0,0,0.05)'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Mois',
                        font: { weight: 'bold' }
                    },
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

// ========== FONCTION DE PRÉVISION BASÉE SUR LA DERNIÈRE ANNÉE ANALYSÉE ==========
function calculerPrevisionAvecDerniereAnnee(stats, data, derniereAnneeAnalysee) {
    const coefficients = stats.coefficients;
    const valeursDerniereAnnee = data[derniereAnneeAnalysee.toString()] || Array(12).fill(0);
    
    // Convertir les valeurs en nombres
    const valeursNumeriques = [];
    for (let i = 0; i < 12; i++) {
        let val = valeursDerniereAnnee[i];
        if (val === null || val === '' || isNaN(val)) {
            val = 0;
        }
        valeursNumeriques.push(parseFloat(val));
    }
    
    // Calculer le coefficient moyen (devrait être 1 en théorie)
    const coefficientMoyen = coefficients.reduce((sum, c) => sum + c, 0) / 12;
    
    // Calculer les prévisions mensuelles
    const moisPrevisions = [];
    for (let i = 0; i < 12; i++) {
        // Méthode 1: Prévision basée sur la dernière année et les coefficients
        let prevision = valeursNumeriques[i] * (coefficients[i] / coefficientMoyen);
        
        // Méthode alternative: si la valeur de l'année est 0, utiliser la moyenne générale
        if (valeursNumeriques[i] === 0) {
            prevision = stats.moyenne_generale * coefficients[i];
        }
        
        moisPrevisions.push(Math.round(prevision));
    }
    
    // Calculer le total prévisionnel
    const totalPrevision = moisPrevisions.reduce((sum, val) => sum + val, 0);
    const totalDerniereAnnee = valeursNumeriques.reduce((sum, val) => sum + val, 0);
    
    // Calculer la variation
    const variation = totalDerniereAnnee > 0 
        ? ((totalPrevision - totalDerniereAnnee) / totalDerniereAnnee) * 100 
        : 0;
    
    // Trouver le meilleur mois
    let meilleurMoisIndex = 0;
    let meilleureValeur = moisPrevisions[0];
    for (let i = 1; i < 12; i++) {
        if (moisPrevisions[i] > meilleureValeur) {
            meilleureValeur = moisPrevisions[i];
            meilleurMoisIndex = i;
        }
    }
    
    const moisNoms = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 
                      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    
    return {
        moisPrevisions: moisPrevisions,
        valeursDerniereAnnee: valeursNumeriques,
        totalPrevision: totalPrevision,
        totalDerniereAnnee: totalDerniereAnnee,
        variation: variation,
        meilleurMois: moisNoms[meilleurMoisIndex],
        meilleureValeur: meilleureValeur,
        moyenneMensuelle: Math.round(totalPrevision / 12)
    };
}

// Initialisation au chargement
document.addEventListener('DOMContentLoaded', function() {
    // Mettre à jour la liste des années disponibles
    fetch('/api/annees')
        .then(response => response.json())
        .then(result => {
            if (result.success && result.annees) {
                const anneeSelect = document.getElementById('anneeSelect');
                const anneeDebut = document.getElementById('anneeDebut');
                const anneeFin = document.getElementById('anneeFin');
                
                if (anneeSelect) {
                    anneeSelect.innerHTML = '<option value="">Sélectionner une année</option>';
                    result.annees.forEach(annee => {
                        anneeSelect.appendChild(new Option(annee, annee));
                    });
                }
                
                if (anneeDebut) {
                    anneeDebut.innerHTML = '';
                    result.annees.forEach(annee => {
                        anneeDebut.appendChild(new Option(annee, annee));
                    });
                }
                
                if (anneeFin) {
                    anneeFin.innerHTML = '';
                    result.annees.forEach(annee => {
                        anneeFin.appendChild(new Option(annee, annee));
                    });
                }
                
                // Sélectionner la dernière année par défaut
                if (result.annees.length > 0 && anneeFin) {
                    anneeFin.value = result.annees[result.annees.length - 1];
                }
                if (result.annees.length > 0 && anneeDebut) {
                    anneeDebut.value = result.annees[result.annees.length - 3] || result.annees[0];
                }
            }
        });
    
    // Initialiser le tableau vide
    rafraichirTableau();
});

// Fonction pour le toggle des modes
function toggleChargementMode() {
    const mode = document.getElementById('chargementType').value;
    const rangeMode = document.getElementById('rangeMode');
    const allMode = document.getElementById('allMode');
    
    if (rangeMode) rangeMode.style.display = mode === 'range' ? 'block' : 'none';
    if (allMode) allMode.style.display = mode === 'all' ? 'block' : 'none';
    
    // Mettre à jour l'indicateur de nombre d'années
    if (mode === 'range') {
        updateNbAnneesRange();
    }
}

function updateNbAnneesRange() {
    const debut = parseInt(document.getElementById('anneeDebut')?.value);
    const fin = parseInt(document.getElementById('anneeFin')?.value);
    const span = document.getElementById('nbAnneesRange');
    
    if (debut && fin && fin >= debut && span) {
        const nbAnnees = fin - debut + 1;
        span.textContent = `${nbAnnees} an${nbAnnees > 1 ? 's' : ''}`;
        
        if (nbAnnees > 5) {
            span.style.backgroundColor = '#ff9800';
        } else if (nbAnnees < 2) {
            span.style.backgroundColor = '#ff9800';
        } else {
            span.style.backgroundColor = '#4caf50';
        }
    }
}





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
        
        // Créer un dégradé pour l'arrière-plan
        const gradient1 = ctx1.createLinearGradient(0, 0, 0, 400);
        gradient1.addColorStop(0, 'rgba(239, 83, 35, 0.4)');   // #ef5323 avec transparence
        gradient1.addColorStop(0.5, 'rgba(251, 193, 77, 0.2)'); // #fbc14d avec transparence
        gradient1.addColorStop(1, 'rgba(239, 83, 35, 0)');      // transparent
        
        try {
            evolutionChart = new Chart(ctx1, {
                type: 'line',
                data: {
                    labels: stats.annees,
                    datasets: [{
                        label: 'Total annuel (Ar)',
                        data: stats.totaux_annuels,
                        borderColor: '#ef5323',
                        borderWidth: 3,
                        backgroundColor: gradient1,
                        tension: 0.4,
                        fill: true,
                        pointBackgroundColor: '#ef5323',
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2,
                        pointRadius: 5,
                        pointHoverRadius: 7,
                        pointHoverBackgroundColor: '#fbc14d'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: {
                        legend: { 
                            position: 'top',
                            labels: {
                                font: { size: 12 },
                                usePointStyle: true
                            }
                        },
                        title: { 
                            display: true, 
                            text: 'Évolution annuelle des revenus',
                            font: { size: 14, weight: 'bold' }
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return `Total: ${context.raw.toLocaleString()} AR`;
                                }
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: { color: 'rgba(0,0,0,0.05)' },
                            title: {
                                display: true,
                                text: 'Montant (AR)',
                                font: { weight: 'bold' }
                            }
                        },
                        x: {
                            grid: { display: false },
                            title: {
                                display: true,
                                text: 'Années',
                                font: { weight: 'bold' }
                            }
                        }
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
        
        // Créer un dégradé pour les barres
        const gradient2 = ctx2.createLinearGradient(0, 0, 0, 400);
        gradient2.addColorStop(0, '#FFA62B');      // Orange clair
        gradient2.addColorStop(0.5, '#E25C2B');    // Orange foncé
        gradient2.addColorStop(1, '#C41E3A');      // Rouge
        
        try {
            distributionChart = new Chart(ctx2, {
                type: 'bar',
                data: {
                    labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'],
                    datasets: [{
                        label: 'Moyenne mensuelle (Ar)',
                        data: stats.moyennes_mensuelles,
                        backgroundColor: gradient2,
                        borderRadius: 8,
                        borderWidth: 0,
                        barPercentage: 0.7,
                        categoryPercentage: 0.8
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: {
                        legend: { 
                            position: 'top',
                            labels: {
                                font: { size: 12 },
                                usePointStyle: true
                            }
                        },
                        title: { 
                            display: true, 
                            text: 'Distribution mensuelle moyenne',
                            font: { size: 14, weight: 'bold' }
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return `Moyenne: ${context.raw.toLocaleString()} AR`;
                                }
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: { color: 'rgba(0,0,0,0.05)' },
                            title: {
                                display: true,
                                text: 'Montant moyen (AR)',
                                font: { weight: 'bold' }
                            },
                            ticks: {
                                callback: function(value) {
                                    return value.toLocaleString();
                                }
                            }
                        },
                        x: {
                            grid: { display: false },
                            title: {
                                display: true,
                                text: 'Mois',
                                font: { weight: 'bold' }
                            }
                        }
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
            
            if (totalRevenus) totalRevenus.textContent = `${stats.total.toLocaleString()} Ar`;
            if (moyenneMensuelle) moyenneMensuelle.textContent = `${Math.round(stats.moyenne_mensuelle).toLocaleString()} Ar`;
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
            mettreAJourStatsCrud();
            crudData = result.data;
            afficherTableauCrud();
            crudModified = false;
            console.log(`${Object.keys(crudData).length} années chargées`);
        } else {
            // Si aucune donnée, créer des années par défaut
            const defaultData = {};
            const currentYear = new Date().getFullYear();
            for (let i = -2; i <= 2; i++) {
                defaultData[currentYear + i] = Array(12).fill(null);
            }
            mettreAJourStatsCrud();
            crudData = defaultData;
            afficherTableauCrud();

        }
    } catch (error) {
        console.error('Erreur chargement:', error);
        document.getElementById('crudStats').innerHTML = '<i class="fa-regular fa-circle-xmark"></i> Erreur de chargement';
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
        cellAnnee.style.backgroundColor = '#faf8e3';
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
    <button onclick="supprimerAnneeCrud('${annee}')" class="btn btn-danger btn-sm" title="Supprimer cette année">
        <i class="fas fa-trash-alt"></i>
    </button>
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
    const sauvegardeBtn = event.target;
    const originalText = sauvegardeBtn.innerHTML;
    
    // Désactiver le bouton
    sauvegardeBtn.disabled = true;
    sauvegardeBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Sauvegarde...';
    
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
            // CHANGEMENT IMMÉDIAT
            crudModified = false;
            
            // Enlever les styles de modification de tous les inputs
            document.querySelectorAll('#crudDataTable input').forEach(input => {
                input.style.backgroundColor = '';
                input.style.borderColor = '#ced4da';
            });
            
            // Mettre à jour les stats immédiatement
            mettreAJourStatsCrud();
            
            if (resultContainer) {
                resultContainer.innerHTML = '<div class="alert alert-success show">✅ Sauvegarde réussie !</div>';
                setTimeout(() => {
                    resultContainer.innerHTML = '';
                }, 2000);
            }
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        console.error('Erreur sauvegarde:', error);
        if (resultContainer) {
            resultContainer.innerHTML = `<div class="alert alert-error show"><i class="fa-solid fa-xmark"></i> Erreur: ${error.message}</div>`;
            setTimeout(() => {
                resultContainer.innerHTML = '';
            }, 3000);
        }
    } finally {
        // Réactiver le bouton
        sauvegardeBtn.disabled = false;
        sauvegardeBtn.innerHTML = originalText;
    }
}

// ========== STATISTIQUES ==========
function mettreAJourStatsCrud() {
    const statsSpan = document.getElementById('crudStats');
    if (!statsSpan) return;
    
    statsSpan.innerHTML = `
        ${crudModified ? ' <i class="fa-solid fa-circle-exclamation"></i> Modifications non sauvegardées' : ' | <i class="fa-solid fa-check"></i> Toutes les modifications sont sauvegardées'}
    `;
    
    // Changer la couleur si modifications non sauvegardées
    if (crudModified) {
        statsSpan.style.color = '#c0352b';
        statsSpan.style.fontWeight = 'bold';
    } else {
        statsSpan.style.color = '#ff5b45';
        statsSpan.style.fontWeight = '';
    }
}

// ========== INITIALISATION ==========
// Surcharger l'initialisation existante
document.addEventListener('DOMContentLoaded', () => {
    console.log("Application démarrée - Mode CRUD simplifié");
    chargerToutesDonneesCrud();
});

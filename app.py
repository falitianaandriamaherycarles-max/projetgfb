from flask import Flask, render_template, request, jsonify
from models import Session as DbSession, DonneeFinanciere, AnneeReference
from datetime import datetime
import json
import logging

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

app = Flask(__name__)
app.secret_key = 'votre_cle_secrete_ici'

# Route principale pour l'interface HTML
@app.route("/", methods=["GET"])
def index():
    db_session = DbSession()
    annees_disponibles = get_annees_actives(db_session)
    db_session.close()
    return render_template("index.html", annees_disponibles=annees_disponibles)

# API pour sauvegarder les données
@app.route("/api/sauvegarder", methods=["POST"])
def api_sauvegarder():
    try:
        data = request.json.get('data')
        if not data:
            return jsonify({"success": False, "error": "Aucune donnée reçue"})
        
        db_session = DbSession()
        sauvegarder_donnees(db_session, data)
        db_session.close()
        
        return jsonify({"success": True, "message": "Données sauvegardées avec succès!"})
    except Exception as e:
        logger.error(f"Erreur sauvegarde: {str(e)}")
        return jsonify({"success": False, "error": str(e)})

# API pour charger les données d'une année
@app.route("/api/charger/<int:annee>", methods=["GET"])
def api_charger(annee):
    try:
        db_session = DbSession()
        data_dict = charger_donnees_par_annee(db_session, annee)
        db_session.close()
        
        if data_dict:
            return jsonify({"success": True, "data": data_dict})
        else:
            return jsonify({"success": False, "error": f"Aucune donnée trouvée pour l'année {annee}"})
    except Exception as e:
        logger.error(f"Erreur chargement: {str(e)}")
        return jsonify({"success": False, "error": str(e)})

# API pour calculer les statistiques
@app.route("/api/calculer", methods=["POST"])
def api_calculer():
    try:
        data = request.json.get('data')
        if not data:
            return jsonify({"success": False, "error": "Aucune donnée reçue"})
        
        resultat = calculer_statistiques(data)
        
        # Sauvegarde automatique si demandée
        if request.json.get('sauvegarde_auto'):
            db_session = DbSession()
            sauvegarder_donnees(db_session, data)
            db_session.close()
            resultat['sauvegarde'] = "Données automatiquement sauvegardées"
        
        return jsonify({"success": True, "resultat": resultat})
    except Exception as e:
        logger.error(f"Erreur calcul: {str(e)}")
        return jsonify({"success": False, "error": str(e)})
    
def get_nom_mois(mois):
    mois_noms = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 
                 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']
    return mois_noms[mois - 1] if 1 <= mois <= 12 else str(mois)

# API pour ajouter une année
@app.route("/api/ajouter_annee", methods=["POST"])
def api_ajouter_annee():
    try:
        data = request.json
        nouvelle_annee = data.get('annee')
        
        if not nouvelle_annee:
            return jsonify({"success": False, "error": "Année non spécifiée"})
        
        db_session = DbSession()
        
        # Vérifier si l'année existe
        existante = db_session.query(AnneeReference).filter_by(annee=nouvelle_annee).first()
        
        if not existante:
            annee_ref = AnneeReference(annee=nouvelle_annee, est_active=1)
            db_session.add(annee_ref)
            db_session.commit()
            message = f"Année {nouvelle_annee} ajoutée avec succès"
        else:
            if existante.est_active == 0:
                existante.est_active = 1
                db_session.commit()
                message = f"Année {nouvelle_annee} réactivée"
            else:
                message = f"L'année {nouvelle_annee} existe déjà"
        
        db_session.close()
        return jsonify({"success": True, "message": message})
    
    except Exception as e:
        return jsonify({"success": False, "error": str(e)})

# API pour supprimer une année
@app.route("/api/supprimer_annee/<int:annee>", methods=["DELETE"])
def api_supprimer_annee(annee):
    try:
        db_session = DbSession()
        annee_ref = db_session.query(AnneeReference).filter_by(annee=annee).first()
        
        if annee_ref:
            db_session.delete(annee_ref)
            db_session.commit()
            message = f"Année {annee} supprimée avec succès"
        else:
            message = f"Année {annee} non trouvée"
        
        db_session.close()
        return jsonify({"success": True, "message": message})
    
    except Exception as e:
        return jsonify({"success": False, "error": str(e)})

# API pour lister les années
@app.route("/api/annees", methods=["GET"])
def api_annees():
    try:
        db_session = DbSession()
        annees = db_session.query(AnneeReference).filter_by(est_active=1).order_by(AnneeReference.annee).all()
        result = [a.annee for a in annees]
        db_session.close()
        return jsonify({"success": True, "annees": result})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)})

# ============ Fonctions utilitaires (à garder inchangées) ============

def sauvegarder_donnees(db_session, data_dict):
    """Sauvegarde les données dans PostgreSQL"""
    try:
        logger.info("Début de la sauvegarde des données")
        
        for annee_str, mois_values in data_dict.items():
            annee = int(annee_str)
            
            # Vérifier ou créer l'année
            annee_ref = db_session.query(AnneeReference).filter_by(annee=annee).first()
            if not annee_ref:
                annee_ref = AnneeReference(annee=annee, est_active=1)
                db_session.add(annee_ref)
                db_session.flush()
            
            # Supprimer les anciennes données
            db_session.query(DonneeFinanciere).filter_by(annee_id=annee_ref.id).delete()
            
            # Insérer les nouvelles données
            for mois_idx, valeur in enumerate(mois_values, 1):
                if valeur is not None and valeur != '':
                    nouvelle_donnee = DonneeFinanciere(
                        annee_id=annee_ref.id,
                        mois=mois_idx,
                        valeur=float(valeur)
                    )
                    db_session.add(nouvelle_donnee)
        
        db_session.commit()
        logger.info("Sauvegarde terminée")
        return True
        
    except Exception as e:
        db_session.rollback()
        raise e

def charger_donnees_par_annee(db_session, annee):
    """Charge les données d'une année spécifique"""
    annee_ref = db_session.query(AnneeReference).filter_by(annee=annee).first()
    
    if not annee_ref:
        return {str(annee): [None] * 12}
    
    donnees = db_session.query(DonneeFinanciere).filter_by(
        annee_id=annee_ref.id
    ).order_by(DonneeFinanciere.mois).all()
    
    data_dict = {str(annee): [None] * 12}
    for donnee in donnees:
        data_dict[str(annee)][donnee.mois - 1] = donnee.valeur
    
    return data_dict

def get_annees_actives(db_session):
    """Récupère les années actives"""
    annees = db_session.query(AnneeReference).filter(
        AnneeReference.est_active == 1
    ).order_by(AnneeReference.annee.desc()).all()
    return [annee.annee for annee in annees]

def calculer_statistiques(data_dict):
    """Calcule les statistiques"""
    annees = sorted(data_dict.keys())
    if not annees:
        return {"error": "Aucune donnée à analyser"}
    
    # Créer une matrice de données
    data_matrix = []
    for annee in annees:
        row = []
        for val in data_dict[annee]:
            if val is not None and val != '':
                row.append(float(val))
            else:
                row.append(0.0)
        data_matrix.append(row)
    
    # Calculs
    nb_annees = len(data_matrix)
    nb_mois = 12
    
    moyennes_mensuelles = []
    for mois in range(nb_mois):
        somme = sum(data_matrix[annee][mois] for annee in range(nb_annees))
        moyennes_mensuelles.append(round(somme / nb_annees if nb_annees > 0 else 0, 2))
    
    somme_totale = sum(sum(row) for row in data_matrix)
    nb_valeurs = nb_annees * nb_mois
    moyenne_generale = round(somme_totale / nb_valeurs if nb_valeurs > 0 else 0, 2)
    
    coefficients = [round(m / moyenne_generale if moyenne_generale != 0 else 0, 2) for m in moyennes_mensuelles]
    
    return {
        "moyennes": moyennes_mensuelles,
        "coefficients": coefficients,
        "moyenne_generale": moyenne_generale,
        "annees": annees
    }

# API pour charger une période d'années
@app.route("/api/charger_periode/<int:annee_debut>/<int:annee_fin>", methods=["GET"])
def api_charger_periode(annee_debut, annee_fin):
    """Charge toutes les années entre deux dates"""
    try:
        if annee_fin < annee_debut:
            return jsonify({"success": False, "error": "L'année de fin doit être supérieure à l'année de début"})
        
        nb_annees = annee_fin - annee_debut + 1
        if nb_annees > 10:
            return jsonify({"success": False, "error": "Trop d'années demandées (max 10)"})
        
        db_session = DbSession()
        data_dict = {}
        
        for annee in range(annee_debut, annee_fin + 1):
            donnees_annee = charger_donnees_par_annee(db_session, annee)
            data_dict.update(donnees_annee)
        
        db_session.close()
        
        if data_dict:
            return jsonify({"success": True, "data": data_dict, "nb_annees": len(data_dict)})
        else:
            return jsonify({"success": False, "error": f"Aucune donnée trouvée pour la période {annee_debut}-{annee_fin}"})
    
    except Exception as e:
        logger.error(f"Erreur chargement période: {str(e)}")
        return jsonify({"success": False, "error": str(e)})

# API pour charger les N dernières années
@app.route("/api/charger_dernieres_annees/<int:nb_annees>", methods=["GET"])
def api_charger_dernieres_annees(nb_annees):
    """Charge les N dernières années disponibles"""
    try:
        if nb_annees < 1 or nb_annees > 10:
            return jsonify({"success": False, "error": "Le nombre d'années doit être entre 1 et 10"})
        
        db_session = DbSession()
        
        # Récupérer les années disponibles triées par ordre décroissant
        annees_disponibles = db_session.query(AnneeReference.annee).filter(
            AnneeReference.est_active == 1
        ).order_by(AnneeReference.annee.desc()).limit(nb_annees).all()
        
        if not annees_disponibles:
            db_session.close()
            return jsonify({"success": False, "error": "Aucune année disponible"})
        
        data_dict = {}
        for (annee,) in annees_disponibles:
            donnees_annee = charger_donnees_par_annee(db_session, annee)
            data_dict.update(donnees_annee)
        
        db_session.close()
        
        return jsonify({
            "success": True, 
            "data": data_dict, 
            "nb_annees": len(data_dict),
            "annees_chargees": list(data_dict.keys())
        })
    
    except Exception as e:
        logger.error(f"Erreur chargement dernières années: {str(e)}")
        return jsonify({"success": False, "error": str(e)})

# API pour charger toutes les années
@app.route("/api/charger_toutes_annees", methods=["GET"])
def api_charger_toutes_annees():
    """Charge toutes les années disponibles"""
    try:
        db_session = DbSession()
        
        # Récupérer toutes les années actives
        annees_disponibles = db_session.query(AnneeReference.annee).filter(
            AnneeReference.est_active == 1
        ).order_by(AnneeReference.annee).all()
        
        if not annees_disponibles:
            db_session.close()
            return jsonify({"success": False, "error": "Aucune année disponible"})
        
        data_dict = {}
        for (annee,) in annees_disponibles:
            donnees_annee = charger_donnees_par_annee(db_session, annee)
            data_dict.update(donnees_annee)
        
        db_session.close()
        
        return jsonify({
            "success": True, 
            "data": data_dict, 
            "nb_annees": len(data_dict),
            "annees_chargees": list(data_dict.keys())
        })
    
    except Exception as e:
        logger.error(f"Erreur chargement toutes années: {str(e)}")
        return jsonify({"success": False, "error": str(e)})

# API pour obtenir les statistiques sur une période personnalisée
@app.route("/api/statistiques_periode", methods=["POST"])
def api_statistiques_periode():
    """Calcule les statistiques sur une période personnalisée"""
    try:
        data = request.json
        annee_debut = data.get('annee_debut')
        annee_fin = data.get('annee_fin')
        
        if not annee_debut or not annee_fin:
            return jsonify({"success": False, "error": "Période non spécifiée"})
        
        db_session = DbSession()
        data_dict = {}
        
        for annee in range(annee_debut, annee_fin + 1):
            donnees_annee = charger_donnees_par_annee(db_session, annee)
            data_dict.update(donnees_annee)
        
        db_session.close()
        
        if not data_dict:
            return jsonify({"success": False, "error": "Aucune donnée pour cette période"})
        
        resultat = calculer_statistiques(data_dict)
        return jsonify({"success": True, "resultat": resultat})
    
    except Exception as e:
        return jsonify({"success": False, "error": str(e)})

def valider_periode_analyse(data_dict, min_annees=2, max_annees=5):
    """Valide qu'une période est appropriée pour l'analyse saisonnière"""
    nb_annees = len(data_dict)
    
    if nb_annees < min_annees:
        return {
            "valide": False,
            "message": f"⚠️ Période trop courte: {nb_annees} année(s). Minimum requis: {min_annees} années pour une analyse saisonnière pertinente."
        }
    
    if nb_annees > max_annees:
        return {
            "valide": True,
            "message": f"ℹ️ Période de {nb_annees} années détectée. L'analyse peut être moins précise à cause des variations à long terme."
        }
    
    # Vérifier qu'il y a assez de données non nulles
    total_valeurs = 0
    valeurs_non_nulles = 0
    
    for mois_values in data_dict.values():
        for val in mois_values:
            if val is not None and val != '':
                valeurs_non_nulles += 1
            total_valeurs += 1
    
    taux_remplissage = (valeurs_non_nulles / total_valeurs) * 100 if total_valeurs > 0 else 0
    
    if taux_remplissage < 50:
        return {
            "valide": False,
            "message": f"⚠️ Taux de données manquantes trop élevé: {taux_remplissage:.1f}% de valeurs non nulles seulement."
        }
    
    return {
        "valide": True,
        "message": f"✅ Période valide: {nb_annees} années, {taux_remplissage:.1f}% de données disponibles."
    }


@app.route("/api/crud/liste", methods=["GET"])
def api_crud_liste():
    try:
        db_session = DbSession()
        donnees = db_session.query(DonneeFinanciere).join(AnneeReference).order_by(
            AnneeReference.annee.desc(), DonneeFinanciere.mois
        ).all()
        
        result = []
        for d in donnees:
            result.append({
                "id": d.id,
                "annee": d.annee_ref.annee,
                "mois": d.mois,
                "valeur": d.valeur,
                "date_creation": d.date_creation.isoformat() if d.date_creation else None
            })
        
        db_session.close()
        return jsonify({"success": True, "data": result})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)})


# ========== ROUTES DASHBOARD ==========
@app.route("/api/dashboard/stats", methods=["GET"])
def api_dashboard_stats():
    try:
        db_session = DbSession()
        donnees = db_session.query(DonneeFinanciere).join(AnneeReference).all()
        
        if not donnees:
            return jsonify({"success": True, "data": {
                "total": 0, "moyenne_mensuelle": 0,
                "meilleur_mois": {"mois": "-", "annee": "-"},
                "nb_annees": 0, "annees": [],
                "totaux_annuels": [], "moyennes_mensuelles": [0] * 12
            }})
        
        total = sum(d.valeur for d in donnees)
        moyenne_mensuelle = total / len(donnees) if donnees else 0
        meilleur = max(donnees, key=lambda x: x.valeur)
        annees_uniques = sorted(set(d.annee_ref.annee for d in donnees))
        
        totaux_annuels = []
        for annee in annees_uniques:
            total_annee = sum(d.valeur for d in donnees if d.annee_ref.annee == annee)
            totaux_annuels.append(total_annee)
        
        moyennes_mensuelles = []
        for mois in range(1, 13):
            valeurs_mois = [d.valeur for d in donnees if d.mois == mois]
            moyenne = sum(valeurs_mois) / len(valeurs_mois) if valeurs_mois else 0
            moyennes_mensuelles.append(moyenne)
        
        db_session.close()
        
        return jsonify({"success": True, "data": {
            "total": total, "moyenne_mensuelle": moyenne_mensuelle,
            "meilleur_mois": {"mois": get_nom_mois(meilleur.mois), "annee": meilleur.annee_ref.annee},
            "nb_annees": len(annees_uniques), "annees": annees_uniques,
            "totaux_annuels": totaux_annuels, "moyennes_mensuelles": moyennes_mensuelles
        }})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)})


if __name__ == "__main__":
    app.run(debug=True)
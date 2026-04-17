from flask import Flask, render_template, request, jsonify
from models import Session as DbSession, DonneeFinanciere
from datetime import datetime
import json
import logging

# Configuration des logs
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

app = Flask(__name__)
app.secret_key = 'votre_cle_secrete_ici'

@app.route("/", methods=["GET", "POST"])
def index():
    result = None
    db_session = DbSession()
    
    if request.method == "POST":
        try:
            action = request.form.get("action", "calculer")
            logger.debug(f"Action reçue: {action}")
            
            if action == "sauvegarder":
                data = request.form.get("data")
                logger.debug(f"Données reçues pour sauvegarde: {data[:200] if data else 'None'}")
                
                if data:
                    data_dict = json.loads(data)
                    sauvegarder_donnees(db_session, data_dict)
                    result = {"success": "Données sauvegardées avec succès!"}
                    logger.info("Sauvegarde réussie")
                else:
                    result = {"error": "Aucune donnée à sauvegarder"}
            
            elif action == "charger":
                annee = request.form.get("annee")
                if annee:
                    data_dict = charger_donnees(db_session, int(annee))
                    result = {"data": data_dict}
            
            elif action == "calculer":
                data = request.form.get("data")
                if data:
                    data_dict = json.loads(data)
                    result = calculer_statistiques(data_dict)
                    
                    # Sauvegarde automatique si cochée
                    if request.form.get("sauvegarde_auto") == "true":
                        logger.info("Sauvegarde automatique activée")
                        sauvegarder_donnees(db_session, data_dict)
                        result["sauvegarde"] = "Données automatiquement sauvegardées"
            
            elif action == "sauvegarder_toutes":
                # Nouvelle action pour sauvegarder toutes les données du formulaire
                data = request.form.get("data")
                if data:
                    data_dict = json.loads(data)
                    sauvegarder_donnees(db_session, data_dict)
                    result = {"success": "Toutes les données ont été sauvegardées!"}
            
        except Exception as e:
            logger.error(f"Erreur: {str(e)}")
            result = {"error": str(e)}
    
    annees_disponibles = get_annees_disponibles(db_session)
    db_session.close()
    
    return render_template("index.html", result=result, annees_disponibles=annees_disponibles)

def sauvegarder_donnees(db_session, data_dict):
    """Sauvegarde les données dans PostgreSQL"""
    try:
        logger.info("Début de la sauvegarde des données")
        annees = list(data_dict.keys())
        logger.info(f"Années à sauvegarder: {annees}")
        
        # Supprimer les anciennes données pour ces années
        for annee in annees:
            deleted = db_session.query(DonneeFinanciere).filter(
                DonneeFinanciere.annee == int(annee)
            ).delete()
            logger.debug(f"Année {annee}: {deleted} enregistrements supprimés")
        
        # Insérer les nouvelles données
        total_inserted = 0
        for annee_str, mois_values in data_dict.items():
            annee = int(annee_str)
            logger.debug(f"Traitement de l'année {annee}")
            
            for mois_idx, valeur in enumerate(mois_values, 1):
                # Ne sauvegarder que les valeurs non nulles et non vides
                if valeur is not None and valeur != '':
                    try:
                        valeur_float = float(valeur)
                        nouvelle_donnee = DonneeFinanciere(
                            annee=annee,
                            mois=mois_idx,
                            valeur=valeur_float
                        )
                        db_session.add(nouvelle_donnee)
                        total_inserted += 1
                        logger.debug(f"Insertion: année={annee}, mois={mois_idx}, valeur={valeur_float}")
                    except ValueError:
                        logger.warning(f"Valeur invalide pour année {annee}, mois {mois_idx}: {valeur}")
        
        db_session.commit()
        logger.info(f"Sauvegarde terminée: {total_inserted} enregistrements insérés")
        return True
        
    except Exception as e:
        logger.error(f"Erreur lors de la sauvegarde: {str(e)}")
        db_session.rollback()
        raise e

def charger_donnees(db_session, annee):
    """Charge les données d'une année spécifique"""
    logger.info(f"Chargement des données pour l'année {annee}")
    donnees = db_session.query(DonneeFinanciere).filter(
        DonneeFinanciere.annee == annee
    ).order_by(DonneeFinanciere.mois).all()
    
    logger.debug(f"{len(donnees)} enregistrements trouvés")
    
    data_dict = {str(annee): [None] * 12}
    for donnee in donnees:
        data_dict[str(annee)][donnee.mois - 1] = donnee.valeur
    
    return data_dict

def get_annees_disponibles(db_session):
    """Récupère la liste des années disponibles dans la base"""
    annees = db_session.query(DonneeFinanciere.annee).distinct().order_by(
        DonneeFinanciere.annee.desc()
    ).all()
    return [annee[0] for annee in annees]

def calculer_statistiques(data_dict):
    """Calcule les statistiques sans pandas"""
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
    
    # Calculer les moyennes mensuelles
    nb_annees = len(data_matrix)
    nb_mois = 12
    
    moyennes_mensuelles = []
    for mois in range(nb_mois):
        somme = 0
        for annee in range(nb_annees):
            somme += data_matrix[annee][mois]
        moyenne = somme / nb_annees if nb_annees > 0 else 0
        moyennes_mensuelles.append(round(moyenne, 2))
    
    # Calculer la moyenne générale
    somme_totale = 0
    nb_valeurs = 0
    for annee in range(nb_annees):
        for mois in range(nb_mois):
            somme_totale += data_matrix[annee][mois]
            nb_valeurs += 1
    
    moyenne_generale = somme_totale / nb_valeurs if nb_valeurs > 0 else 0
    
    # Calculer les coefficients saisonniers
    coefficients = []
    for moyenne_mensuelle in moyennes_mensuelles:
        if moyenne_generale != 0:
            coeff = moyenne_mensuelle / moyenne_generale
        else:
            coeff = 0
        coefficients.append(round(coeff, 2))
    
    return {
        "moyennes": moyennes_mensuelles,
        "coefficients": coefficients,
        "moyenne_generale": round(moyenne_generale, 2),
        "annees": annees
    }

@app.route("/ajouter_annee", methods=["POST"])
def ajouter_annee():
    try:
        db_session = DbSession()
        nouvelle_annee = int(request.form.get("annee"))
        
        # Vérifier si l'année existe déjà
        existante = db_session.query(DonneeFinanciere).filter(
            DonneeFinanciere.annee == nouvelle_annee
        ).first()
        
        if not existante:
            # Créer des entrées vides pour la nouvelle année
            for mois in range(1, 13):
                nouvelle_donnee = DonneeFinanciere(
                    annee=nouvelle_annee,
                    mois=mois,
                    valeur=0.0
                )
                db_session.add(nouvelle_donnee)
            db_session.commit()
            message = f"Année {nouvelle_annee} ajoutée avec succès"
        else:
            message = f"L'année {nouvelle_annee} existe déjà"
        
        db_session.close()
        return jsonify({"success": True, "message": message})
    
    except Exception as e:
        return jsonify({"success": False, "error": str(e)})

@app.route("/supprimer_annee/<int:annee>", methods=["DELETE"])
def supprimer_annee(annee):
    try:
        db_session = DbSession()
        deleted = db_session.query(DonneeFinanciere).filter(
            DonneeFinanciere.annee == annee
        ).delete()
        db_session.commit()
        db_session.close()
        return jsonify({"success": True, "message": f"Année {annee} supprimée ({deleted} enregistrements)"})
    
    except Exception as e:
        return jsonify({"success": False, "error": str(e)})

@app.route("/verifier_donnees", methods=["GET"])
def verifier_donnees():
    """Endpoint pour vérifier les données dans la base"""
    try:
        db_session = DbSession()
        count = db_session.query(DonneeFinanciere).count()
        annees = db_session.query(DonneeFinanciere.annee).distinct().all()
        
        return jsonify({
            "total_enregistrements": count,
            "annees": [a[0] for a in annees]
        })
    except Exception as e:
        return jsonify({"error": str(e)})

if __name__ == "__main__":
    app.run(debug=True)
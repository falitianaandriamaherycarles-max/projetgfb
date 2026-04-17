from sqlalchemy import create_engine, Column, Integer, Float, String, Date
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
from config import Config

Base = declarative_base()

class DonneeFinanciere(Base):
    __tablename__ = 'donnees_financieres'
    
    id = Column(Integer, primary_key=True)
    annee = Column(Integer, nullable=False)
    mois = Column(Integer, nullable=False)  # 1-12
    valeur = Column(Float, nullable=False)
    date_creation = Column(Date, default=datetime.now().date())
    commentaire = Column(String(255), nullable=True)
    
    def __repr__(self):
        return f"<DonneeFinanciere(annee={self.annee}, mois={self.mois}, valeur={self.valeur})>"

class AnneeReference(Base):
    __tablename__ = 'annees_reference'
    
    id = Column(Integer, primary_key=True)
    annee = Column(Integer, nullable=False, unique=True)
    est_active = Column(Integer, default=1)  # 1 pour active, 0 pour inactive

# Connexion à la base de données
engine = create_engine(Config.DATABASE_URL)
Base.metadata.create_all(engine)
Session = sessionmaker(bind=engine)
from sqlalchemy import create_engine, Column, Integer, Float, String, Date, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime
from config import Config

Base = declarative_base()

class AnneeReference(Base):
    __tablename__ = 'annees_reference'
    
    id = Column(Integer, primary_key=True)
    annee = Column(Integer, nullable=False, unique=True)
    est_active = Column(Integer, default=1)  # 1 pour active, 0 pour inactive
    date_creation = Column(Date, default=datetime.now().date())
    
    # Relation avec DonneeFinanciere
    donnees = relationship("DonneeFinanciere", back_populates="annee_ref", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<AnneeReference(annee={self.annee}, est_active={self.est_active})>"
    
    @property
    def est_active_bool(self):
        return self.est_active == 1
    
    @est_active_bool.setter
    def est_active_bool(self, value):
        self.est_active = 1 if value else 0

class DonneeFinanciere(Base):
    __tablename__ = 'donnees_financieres'
    
    id = Column(Integer, primary_key=True)
    annee_id = Column(Integer, ForeignKey('annees_reference.id', ondelete='CASCADE'), nullable=False)
    mois = Column(Integer, nullable=False)  # 1-12
    valeur = Column(Float, nullable=False)
    date_creation = Column(Date, default=datetime.now().date())
        
    # Relation avec AnneeReference
    annee_ref = relationship("AnneeReference", back_populates="donnees")
    
    def __repr__(self):
        return f"<DonneeFinanciere(annee={self.annee_ref.annee if self.annee_ref else 'None'}, mois={self.mois}, valeur={self.valeur})>"

# Connexion à la base de données
engine = create_engine(Config.DATABASE_URL)
Base.metadata.create_all(engine)
Session = sessionmaker(bind=engine)
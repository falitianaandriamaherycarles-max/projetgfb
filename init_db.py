from models import Base, engine

def init_database():
    print("Création des tables dans PostgreSQL...")
    Base.metadata.create_all(engine)
    print("Tables créées avec succès!")

if __name__ == "__main__":
    init_database()
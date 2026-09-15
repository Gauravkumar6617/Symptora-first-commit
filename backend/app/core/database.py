from sqlalchemy import create_engine ,text
from sqlalchemy.orm import sessionmaker,DeclarativeBase
from app.core.config import settings

engine = create_engine(str(settings.DATABASE_URL),pool_pre_ping=True) 
# we usig str as in config we are using POstgresDSN AS it required to in string and prepoolping so it can check before using its valid or not

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
#autocommit= doesn't automatically save your database changes.need to add db.commit()
#autoflush=  SQLAlchemy won't automatically flush pending changes before certain queries.


#I have make the Base  parent class for all your SQLAlchemy models
class Base(DeclarativeBase):
    pass


#This function creates a database session for each FastAPI request.
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


#test db
def database_check()->bool:
    try:
        with engine.connect() as connection:
         connection.execute(text("SELECT 1")) #with select 1 it goes and return
         return True
    except Exception as e:
        print(f"Database connection error: {e}")
        return False
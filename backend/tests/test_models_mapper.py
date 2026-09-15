import pkgutil
import importlib

import app.models
from sqlalchemy.orm import configure_mappers


def test_sqlalchemy_mappers_configure_cleanly():
    """Catches broken relationship()/back_populates references (wrong class name,
    missing back_populates target, etc.) across all model files.

    Import every model module so its classes register with the ORM registry,
    then let SQLAlchemy resolve all relationships.
    """
    for _, name, _ in pkgutil.iter_modules(app.models.__path__):
        importlib.import_module(f"app.models.{name}")

    configure_mappers()

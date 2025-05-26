"""
Konfigurationsdatei für das Mitarbeiterportal-Backend.
Enthält Datenbankverbindungsdetails und andere Konfigurationseinstellungen.
"""

import os
from datetime import timedelta

class Config:
    """Basis-Konfigurationsklasse mit Standardeinstellungen."""
    # Flask-Konfiguration
    SECRET_KEY = os.environ.get('SECRET_KEY', 'super-secret-key')
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'super-secret-jwt-key')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1)
    
    # Datenbank-Konfiguration
    DB_HOST = os.environ.get('DB_HOST', 'localhost')
    DB_PORT = os.environ.get('DB_PORT', '5432')
    DB_NAME = os.environ.get('DB_NAME', 'mitarbeiterportal')
    DB_USER = os.environ.get('DB_USER', 'admin')
    DB_PASSWORD = os.environ.get('DB_PASSWORD', 'mai2025mai#Tobi')
    
    # SQLAlchemy-Konfiguration
    SQLALCHEMY_DATABASE_URI = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
    SQLALCHEMY_TRACK_MODIFICATIONS = False

class DevelopmentConfig(Config):
    """Entwicklungskonfiguration."""
    DEBUG = True

class ProductionConfig(Config):
    """Produktionskonfiguration."""
    DEBUG = False
    # In Produktion sollten die Umgebungsvariablen gesetzt sein
    SECRET_KEY = os.environ.get('SECRET_KEY')
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY')
    DB_PASSWORD = os.environ.get('DB_PASSWORD')

class TestingConfig(Config):
    """Testkonfiguration."""
    TESTING = True
    DB_NAME = os.environ.get('DB_NAME', 'mitarbeiterportal_test')

# Konfigurationsmapping
config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig
}

# Aktuelle Konfiguration basierend auf Umgebungsvariable
current_config = config[os.environ.get('FLASK_ENV', 'default')] 
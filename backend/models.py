"""
Datenbankmodelle für das Mitarbeiterportal.
Implementiert die SQLAlchemy-Modelle basierend auf dem Data Vault-Schema.
"""

from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import hashlib

db = SQLAlchemy()

def generate_hash_key(value):
    """Generiert einen Hash-Key für Data Vault-Tabellen."""
    return hashlib.sha256(str(value).encode()).digest()

class HUser(db.Model):
    """Hub für Benutzer."""
    __tablename__ = 'h_user'
    
    hk_user = db.Column(db.LargeBinary(32), primary_key=True)
    user_id = db.Column(db.String(255), unique=True, nullable=False)
    t_from = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    rec_src = db.Column(db.String(255), nullable=False)

    # Beziehungen
    details = db.relationship('SUserDetails', backref='user', lazy=True)
    login = db.relationship('SUserLogin', backref='user', lazy=True)
    current_project = db.relationship('SUserCurrentProject', backref='user', lazy=True)
    time_entries = db.relationship('LUserProjectTimeEntry', backref='user', lazy=True)

class HProject(db.Model):
    """Hub für Projekte."""
    __tablename__ = 'h_project'
    
    hk_project = db.Column(db.LargeBinary(32), primary_key=True)
    project_name = db.Column(db.String(255), unique=True, nullable=False)
    t_from = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    rec_src = db.Column(db.String(255), nullable=False)

    # Beziehungen
    details = db.relationship('SProjectDetails', backref='project', lazy=True)
    time_entries = db.relationship('LUserProjectTimeEntry', backref='project', lazy=True)

class LUserProjectTimeEntry(db.Model):
    """Link zwischen Benutzer, Projekt und Zeiteintrag."""
    __tablename__ = 'l_user_project_timeentry'
    
    hk_user_project_timeentry = db.Column(db.LargeBinary(32), primary_key=True)
    hk_user = db.Column(db.LargeBinary(32), db.ForeignKey('h_user.hk_user'), nullable=False)
    hk_project = db.Column(db.LargeBinary(32), db.ForeignKey('h_project.hk_project'), nullable=False)
    timeentry_id = db.Column(db.String(255))
    t_from = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    rec_src = db.Column(db.String(255), nullable=False)

    # Beziehungen
    time_entry_details = db.relationship('STimeEntryDetails', backref='time_entry', lazy=True)

class SUserDetails(db.Model):
    """Satellite für Benutzerdetails."""
    __tablename__ = 's_user_details'
    
    hk_user = db.Column(db.LargeBinary(32), db.ForeignKey('h_user.hk_user'), nullable=False)
    t_from = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    t_to = db.Column(db.DateTime)
    b_from = db.Column(db.Date, nullable=False)
    b_to = db.Column(db.Date)
    rec_src = db.Column(db.String(255), nullable=False)
    first_name = db.Column(db.String(255))
    last_name = db.Column(db.String(255))
    position = db.Column(db.String(255))
    core_hours = db.Column(db.String(255))
    telefon = db.Column(db.String(255))

    __table_args__ = (
        db.PrimaryKeyConstraint('hk_user', 't_from'),
    )

class SUserLogin(db.Model):
    """Satellite für Benutzer-Anmeldedaten."""
    __tablename__ = 's_user_login'
    
    hk_user = db.Column(db.LargeBinary(32), db.ForeignKey('h_user.hk_user'), nullable=False)
    t_from = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    t_to = db.Column(db.DateTime)
    b_from = db.Column(db.Date, nullable=False)
    b_to = db.Column(db.Date)
    rec_src = db.Column(db.String(255), nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)

    __table_args__ = (
        db.PrimaryKeyConstraint('hk_user', 't_from'),
    )

class SProjectDetails(db.Model):
    """Satellite für Projektdetails."""
    __tablename__ = 's_project_details'
    
    hk_project = db.Column(db.LargeBinary(32), db.ForeignKey('h_project.hk_project'), nullable=False)
    t_from = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    t_to = db.Column(db.DateTime)
    b_from = db.Column(db.Date, nullable=False)
    b_to = db.Column(db.Date)
    rec_src = db.Column(db.String(255), nullable=False)
    project_name = db.Column(db.String(255), nullable=False)

    __table_args__ = (
        db.PrimaryKeyConstraint('hk_project', 't_from'),
    )

class STimeEntryDetails(db.Model):
    """Satellite für Zeiteintrag-Details."""
    __tablename__ = 's_timeentry_details'
    
    hk_user_project_timeentry = db.Column(db.LargeBinary(32), db.ForeignKey('l_user_project_timeentry.hk_user_project_timeentry'), nullable=False)
    t_from = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    t_to = db.Column(db.DateTime)
    b_from = db.Column(db.Date, nullable=False)
    b_to = db.Column(db.Date)
    rec_src = db.Column(db.String(255), nullable=False)
    entry_date = db.Column(db.Date, nullable=False)
    start_time = db.Column(db.Time, nullable=False)
    end_time = db.Column(db.Time)
    pause_minutes = db.Column(db.Integer)
    work_location = db.Column(db.String(255))
    description = db.Column(db.Text)

    __table_args__ = (
        db.PrimaryKeyConstraint('hk_user_project_timeentry', 't_from'),
    )

class SUserCurrentProject(db.Model):
    """Satellite für das aktuell zugewiesene Projekt des Benutzers."""
    __tablename__ = 's_user_current_project'
    
    hk_user = db.Column(db.LargeBinary(32), db.ForeignKey('h_user.hk_user'), nullable=False)
    t_from = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    t_to = db.Column(db.DateTime)
    b_from = db.Column(db.Date, nullable=False)
    b_to = db.Column(db.Date)
    rec_src = db.Column(db.String(255), nullable=False)
    hk_project = db.Column(db.LargeBinary(32), db.ForeignKey('h_project.hk_project'), nullable=False)

    __table_args__ = (
        db.PrimaryKeyConstraint('hk_user', 't_from'),
    ) 
from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
import os

# Blueprints importieren
from auth import auth_bp
from customer import customer_bp
from project import project_bp
from time_matrix import time_matrix_bp

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})
app.config["JWT_SECRET_KEY"] = os.environ.get("JWT_SECRET_KEY", "supersecretkey")
app.config["DB_HOST"] = os.environ.get("DB_HOST", "db")
app.config["DB_NAME"] = os.environ.get("DB_NAME", "mitarbeiterportal")
app.config["DB_USER"] = os.environ.get("DB_USER", "admin")
app.config["DB_PASSWORD"] = os.environ.get("DB_PASSWORD", "secret")

jwt = JWTManager(app)

# Blueprints registrieren
app.register_blueprint(auth_bp)
app.register_blueprint(project_bp)
app.register_blueprint(customer_bp)

# KEINE Auth-Routen mehr direkt in dieser Datei!
# Nur noch ggf. einen einfachen Root-Endpoint:
@app.route("/")
def hello():
    return "Mitarbeiterportal Backend läuft!"

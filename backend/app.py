from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
import os
from datetime import timedelta

# Import aller Blueprints
from auth import auth_bp
from profile import profile_bp
from project import project_bp
from customer import customer_bp

app = Flask(__name__)

# JWT Konfiguration
app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY', 'dev-secret-key')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=8)

# Datenbank-Konfiguration
app.config["DB_HOST"] = os.environ.get("DB_HOST", "localhost")
app.config["DB_NAME"] = os.environ.get("DB_NAME", "mitarbeiterportal")
app.config["DB_USER"] = os.environ.get("DB_USER", "postgres")
app.config["DB_PASSWORD"] = os.environ.get("DB_PASSWORD", "postgres")

jwt = JWTManager(app)
CORS(app, supports_credentials=True)

# Registriere alle Blueprints
app.register_blueprint(auth_bp)
app.register_blueprint(profile_bp)
app.register_blueprint(project_bp)
app.register_blueprint(customer_bp)

@app.route('/')
def home():
    return 'Mitarbeiterportal API läuft!'

if __name__ == "__main__":
    app.run(debug=True, host='0.0.0.0')

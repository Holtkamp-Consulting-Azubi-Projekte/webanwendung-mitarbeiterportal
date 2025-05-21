from flask import Flask, jsonify, request
from flask_cors import CORS
from auth import register_user, login_user
from flask_jwt_extended import create_access_token, jwt_required, JWTManager
from time_matrix import time_matrix_bp  # Importiere den Zeitmatrix-Blueprint

app = Flask(__name__)
CORS(app)

# Setup the Flask-JWT-Extended extension
app.config["JWT_SECRET_KEY"] = "super-secret"  # Change this! In production, use a random secret from env var
jwt = JWTManager(app)

# Zeitmatrix-Blueprint registrieren
app.register_blueprint(time_matrix_bp)

@app.route("/api/ping")
def ping():
    return jsonify({"status": "ok", "message": "Backend läuft"})

@app.route('/api/register', methods=['POST'])
def register():
    return register_user()

@app.route('/api/login', methods=['POST'])
def login():
    # Wir werden die login_user Funktion in auth.py so anpassen, dass sie create_access_token aufruft
    # und den Token zurückgibt.
    return login_user()

@app.route("/api/protected", methods=["GET"])
@jwt_required()
def protected():
    # Beispiel für eine geschützte Route, die einen gültigen JWT erfordert
    return jsonify(logged_in_as="current_user.identity"), 200 # TODO: identity abrufen

if __name__ == "__main__":
    app.run(debug=True, port=5050)

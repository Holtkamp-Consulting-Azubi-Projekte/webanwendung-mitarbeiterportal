from flask import Flask, jsonify
from flask_cors import CORS
from time_matrix import time_matrix_bp  # <-- Neuer Blueprint für Zeitmatrix

app = Flask(__name__)
CORS(app)

# Zeitmatrix-Blueprint registrieren
app.register_blueprint(time_matrix_bp)

@app.route("/api/ping")
def ping():
    return jsonify({"status": "ok", "message": "Backend läuft"})

if __name__ == "__main__":
    app.run(debug=True, port=5050)

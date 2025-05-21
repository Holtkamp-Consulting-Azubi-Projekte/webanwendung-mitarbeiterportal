from flask import Flask, jsonify
from flask_cors import CORS
from auth import register_user, login_user

app = Flask(__name__)
CORS(app)

@app.route("/api/ping")
def ping():
    return jsonify({"status": "ok", "message": "Backend läuft"})

@app.route('/api/register', methods=['POST'])
def register():
    return register_user()

@app.route('/api/login', methods=['POST'])
def login():
    return login_user()

if __name__ == "__main__":
    app.run(debug=True, port=5050)

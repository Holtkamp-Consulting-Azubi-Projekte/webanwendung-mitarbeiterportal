from flask import Flask
from flask_cors import CORS
from auth import auth_bp

app = Flask(__name__)

# ✅ Hier erlaubst du explizit den Zugriff vom Frontend-Port 5173
CORS(app, resources={r"/api/*": {"origins": ["http://localhost:5173", "http://127.0.0.1:5173"]}})
app.register_blueprint(auth_bp, url_prefix='/api')

@app.route('/')
def index():
    return 'Flask-Backend läuft!'

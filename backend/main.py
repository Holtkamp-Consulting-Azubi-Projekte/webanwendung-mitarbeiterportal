from flask import Flask
from routes.auth import auth_bp
from routes.user import user_bp
from routes.project import project_bp
from routes.time import time_bp

app = Flask(__name__)

# Blueprints registrieren
app.register_blueprint(auth_bp, url_prefix="/api/auth")
app.register_blueprint(user_bp, url_prefix="/api/user")
app.register_blueprint(project_bp, url_prefix="/api/project")
app.register_blueprint(time_bp, url_prefix="/api/time")

if __name__ == "__main__":
    app.run(debug=True)

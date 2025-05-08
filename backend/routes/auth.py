from flask import Blueprint, jsonify, request
from app.utils.helpers import save_json
from app.config import SESSION_FILE

auth_bp = Blueprint("auth", __name__)

@auth_bp.route("/login", methods=["POST"])
def login():
    # Login-Logik hier
    return jsonify({"message": "Login erfolgreich"}), 200

@auth_bp.route("/logout", methods=["POST"])
def logout():
    save_json({}, SESSION_FILE)  # Session löschen
    return jsonify({"message": "Session gelöscht"}), 200

@auth_bp.route("/session", methods=["GET"])
def check_session():
    # Session-Timeout-Logik hier
    return jsonify({"active": True}), 200
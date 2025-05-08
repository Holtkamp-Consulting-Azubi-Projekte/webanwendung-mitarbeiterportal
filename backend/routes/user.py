from flask import Blueprint, jsonify

user_bp = Blueprint("user", __name__)

@user_bp.route("/<email>", methods=["GET"])
def get_user(email):
    # Benutzerinformationen abrufen
    return jsonify({"email": email, "name": "Max Mustermann"}), 200
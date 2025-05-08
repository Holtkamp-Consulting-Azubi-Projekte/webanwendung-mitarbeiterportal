from flask import Blueprint, jsonify

project_bp = Blueprint("project", __name__)

@project_bp.route("/", methods=["GET"])
def get_projects():
    # Projekte abrufen
    return jsonify({"projects": []}), 200
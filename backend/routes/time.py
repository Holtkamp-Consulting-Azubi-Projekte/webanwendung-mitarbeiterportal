from flask import Blueprint, jsonify

time_bp = Blueprint("time", __name__)

@time_bp.route("/start", methods=["POST"])
def start_time():
    # Zeit starten
    return jsonify({"message": "Zeit gestartet"}), 200
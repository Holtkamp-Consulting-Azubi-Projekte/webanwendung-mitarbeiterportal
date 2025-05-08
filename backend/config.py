import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))  # backend
DATA_DIR = os.path.join(BASE_DIR, "data")  # backend/data

SESSION_FILE = os.path.join(DATA_DIR, "session.json")
USERS_FILE = os.path.join(DATA_DIR, "users.json")
PROJECTS_FILE = os.path.join(DATA_DIR, "projects.json")
LOGS_FILE = os.path.join(DATA_DIR, "logs.json")
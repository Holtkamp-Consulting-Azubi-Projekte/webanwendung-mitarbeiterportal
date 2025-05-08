import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))  # backend/app
BACKEND_DIR = os.path.dirname(BASE_DIR)  # backend
DATA_DIR = os.path.join(BACKEND_DIR, "data")  # backend/data

SESSION_FILE = os.path.join(DATA_DIR, "session.json")
USERS_FILE = os.path.join(DATA_DIR, "users.json")
PROJECTS_FILE = os.path.join(DATA_DIR, "projects.json")
LOGS_FILE = os.path.join(DATA_DIR, "logs.json")
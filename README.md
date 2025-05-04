# 🧑‍💼 Webanwendung Mitarbeiterportal

Dies ist eine moderne Webanwendung zur Verwaltung von Mitarbeitenden, Arbeitszeiten und Projekten. Die App wurde im Rahmen eines Abschlussprojekts entwickelt und basiert auf einem Fullstack-Stack mit React, Flask und PostgreSQL.

---

## 🚀 Funktionen

- ✅ Benutzer-Registrierung und Login
- ✅ Passwort-Hashing und sichere Session-Verwaltung (JSON-basiert)
- ✅ Navigation mit geschütztem Dashboard
- ✅ Logout-Funktion mit Session-Handling
- ✅ Login- und Registerseiten mit integriertem Firmenlogo
- ✅ Responsives Frontend mit Tailwind CSS
- ✅ Backend-API in Flask (Python)
- ✅ JSON-Dateien für einfache Datenhaltung (users, session, logs)

---

## 🛠 Tech Stack

### Frontend
- **React** – UI-Entwicklung mit Komponentenlogik und JSX  
  🔗 [React Dokumentation](https://react.dev/)
- **Vite** – Build-Tool für schnelle Entwicklung  
  🔗 [Vite Dokumentation](https://vitejs.dev/)
- **Tailwind CSS** – Utility-first CSS-Framework  
  🔗 [Tailwind CSS Dokumentation](https://tailwindcss.com/)
- **React Router DOM** – Clientseitiges Routing  
  🔗 [React Router Dokumentation](https://reactrouter.com/en/main)

### Backend
- **Flask** – Python Webframework zur Erstellung von REST APIs  
  🔗 [Flask Dokumentation](https://flask.palletsprojects.com/)
- **Flask-CORS** – CORS-Handling für Cross-Origin-Anfragen  
  🔗 [Flask-CORS Dokumentation](https://flask-cors.readthedocs.io/en/latest/)
- **Gunicorn** – WSGI-HTTP Server für den produktiven Einsatz  
  🔗 [Gunicorn Dokumentation](https://docs.gunicorn.org/en/stable/)

### Datenhaltung
- **JSON-Dateien** – Temporäre Speicherung der Benutzer-, Sitzungs- und Logdaten als Dictionaries
- **PostgreSQL** – Für die produktive Datenbankanbindung vorbereitet  
  🔗 [PostgreSQL Dokumentation](https://www.postgresql.org/docs/)
- **DBVisualizer** – GUI zur Datenbankinspektion  
  🔗 [DBVisualizer Guide](https://www.dbvis.com/docs/)

### Hosting & Infrastruktur
- **Nginx** – Reverse Proxy für das Hosting von Backend & Frontend  
  🔗 [Nginx Dokumentation](https://nginx.org/en/docs/)
- **Raspberry Pi** – Lokales Deployment auf Einplatinencomputer  
  🔗 [Raspberry Pi Dokumentation](https://www.raspberrypi.com/documentation/)
- **Python 3.13.3** – Laufzeitumgebung für das Flask-Backend  
  🔗 [Python 3.13.3 Dokumentation](https://docs.python.org/3.13/)

---

## 📁 Projektstruktur (Auszug)

```plaintext
webanwendung-mitarbeiterportal/
├── backend/
│   ├── app.py
│   ├── data/
│   │   ├── users.json
│   │   ├── session.json
│   │   └── logs.json
│   └── ...
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── Header.jsx
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   └── Logout.jsx
│   │   ├── App.jsx
│   │   └── assets/
│   │       └── logo.png
└── README.md

▶️ Lokale Entwicklung

🖥️ Frontend starten

cd frontend
npm install
npm run dev

🐍 Backend starten (in virtualenv)

cd backend
source venv/bin/activate
python app.py

🔒 Hinweise zur Sicherheit
Passwörter werden gehasht gespeichert (SHA256)

Sessions werden in session.json gespeichert

CORS ist für http://localhost:5173 freigeschaltet

Für Produktion wird später PostgreSQL verwendet

🧪 Nächste Schritte
 Rollen- und Rechteverwaltung

 Datenbankanbindung an PostgreSQL

 Benutzerverwaltung im Dashboard

 Adminfunktionen

 👨‍💻 Entwickler
Marco Grochowiak
Projekt im Rahmen der Umschulung zum Fachinformatiker (Daten- & Prozessanalyse)

📄 Lizenz
Privates Ausbildungsprojekt. Keine kommerzielle Nutzung.
# Nutze ein offizielles Node.js Image als Basis
FROM node:18

# Setze das Arbeitsverzeichnis im Container
WORKDIR /app

# Kopiere package.json und package-lock.json in das Arbeitsverzeichnis
# (Dies nutzt den Docker-Build-Cache effizient aus)
COPY package*.json ./

# Installiere die Abhängigkeiten
RUN npm install

# Kopiere den Rest des Anwendungscodes in das Arbeitsverzeichnis
COPY . .

# Starte den Vite Entwicklungsserver
# --host 0.0.0.0 stellt sicher, dass der Server von außerhalb des Containers erreichbar ist
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
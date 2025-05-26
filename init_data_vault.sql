-- Optional: Schema erstellen, falls benötigt
-- CREATE SCHEMA data_vault;
-- SET search_path TO data_vault;

-- Hub für Benutzer
CREATE TABLE H_USER (
    HK_USER BYTEA PRIMARY KEY, -- Hash Key (z.B. SHA-256 Hash der USER_ID)
    USER_ID VARCHAR(255) UNIQUE NOT NULL, -- Fachlicher Geschäftsschlüssel (z.B. E-Mail)
    T_FROM TIMESTAMP NOT NULL,       -- Technischer Gültigkeitsbeginn (ersetzt LOAD_DTS)
    REC_SRC VARCHAR(255) NOT NULL      -- Quelle des Datensatzes
);

-- Hub für Projekte
CREATE TABLE H_PROJECT (
    HK_PROJECT BYTEA PRIMARY KEY, -- Hash Key (z.B. SHA-256 Hash des PROJECT_NAME)
    PROJECT_NAME VARCHAR(255) UNIQUE NOT NULL, -- Fachlicher Geschäftsschlüssel
    T_FROM TIMESTAMP NOT NULL,        -- Technischer Gültigkeitsbeginn
    REC_SRC VARCHAR(255) NOT NULL       -- Quelle des Datensatzes
);

-- Link, der Benutzer, Projekt und Zeiteintrag verbindet
-- Links enthalten typischerweise keine fachlichen Attribute und sind selten bitemporal
CREATE TABLE L_USER_PROJECT_TIMEENTRY (
    HK_USER_PROJECT_TIMEENTRY BYTEA PRIMARY KEY, -- Hash Key (z.B. Hash aus HK_USER, HK_PROJECT, TIMEENTRY_ID)
    HK_USER BYTEA NOT NULL, -- Fremdschlüssel zu H_USER
    HK_PROJECT BYTEA NOT NULL, -- Fremdschlüssel zu H_PROJECT
    -- Fachlicher Schlüssel für den Zeiteintrag selbst (optional, aber nützlich)
    -- Eine Kombination aus Benutzer-ID, Datum, Beginnzeit könnte ein möglicher fachlicher Schlüssel sein
    TIMEENTRY_ID VARCHAR(255),
    T_FROM TIMESTAMP NOT NULL,       -- Technischer Gültigkeitsbeginn
    REC_SRC VARCHAR(255) NOT NULL,     -- Quelle des Datensatzes

    FOREIGN KEY (HK_USER) REFERENCES H_USER(HK_USER),
    FOREIGN KEY (HK_PROJECT) REFERENCES H_PROJECT(HK_PROJECT)
    -- CONSTRAINT UQ_L_USER_PROJECT_TIMEENTRY UNIQUE (HK_USER, HK_PROJECT, TIMEENTRY_ID) -- Optionaler Unique Constraint für die Geschäftsschlüssel-Kombination
);

-- Satellite für Benutzerdetails (bitemporal)
CREATE TABLE S_USER_DETAILS (
    HK_USER BYTEA NOT NULL, -- Fremdschlüssel zu H_USER
    T_FROM TIMESTAMP NOT NULL,    -- Technischer Gültigkeitsbeginn (Teil des Primary Key)
    T_TO TIMESTAMP NULL,          -- Technisches Gültigkeitsende (NULL für aktuellsten Satz)
    B_FROM DATE NOT NULL,         -- Fachlicher Gültigkeitsbeginn
    B_TO DATE NULL,               -- Fachliches Gültigkeitsende (NULL für aktuellsten Satz)
    REC_SRC VARCHAR(255) NOT NULL,  -- Quelle des Datensatzes
    FIRST_NAME VARCHAR(255),
    LAST_NAME VARCHAR(255),
    POSITION VARCHAR(255),
    CORE_HOURS VARCHAR(255), -- Format wie "8:00-17:00"
    TELEFON VARCHAR(255),

    PRIMARY KEY (HK_USER, T_FROM), -- Primärschlüssel für Historisierung
    FOREIGN KEY (HK_USER) REFERENCES H_USER(HK_USER)
);

-- Satellite für Benutzer-Anmeldedaten (bitemporal, getrennt für Sicherheit)
CREATE TABLE S_USER_LOGIN (
    HK_USER BYTEA NOT NULL, -- Fremdschlüssel zu H_USER
    T_FROM TIMESTAMP NOT NULL,    -- Technischer Gültigkeitsbeginn (Teil des Primary Key)
    T_TO TIMESTAMP NULL,          -- Technisches Gültigkeitsende
    B_FROM DATE NOT NULL,         -- Fachlicher Gültigkeitsbeginn
    B_TO DATE NULL,               -- Fachliches Gültigkeitsende
    REC_SRC VARCHAR(255) NOT NULL,  -- Quelle des Datensatzes
    PASSWORD_HASH VARCHAR(255) NOT NULL, -- Gespeichertes Passwort (immer gehasht)

    PRIMARY KEY (HK_USER, T_FROM), -- Primärschlüssel für Historisierung
    FOREIGN KEY (HK_USER) REFERENCES H_USER(HK_USER)
);

-- Satellite für Projektdetails (bitemporal)
CREATE TABLE S_PROJECT_DETAILS (
    HK_PROJECT BYTEA NOT NULL, -- Fremdschlüssel zu H_PROJECT
    T_FROM TIMESTAMP NOT NULL,     -- Technischer Gültigkeitsbeginn (Teil des Primary Key)
    T_TO TIMESTAMP NULL,           -- Technisches Gültigkeitsende
    B_FROM DATE NOT NULL,          -- Fachlicher Gültigkeitsbeginn
    B_TO DATE NULL,                -- Fachliches Gültigkeitsende
    REC_SRC VARCHAR(255) NOT NULL,   -- Quelle des Datensatzes
    PROJECT_NAME VARCHAR(255) NOT NULL, -- Redundant zum Hub, aber praktisch für Historisierung

    PRIMARY KEY (HK_PROJECT, T_FROM), -- Primärschlüssel für Historisierung
    FOREIGN KEY (HK_PROJECT) REFERENCES H_PROJECT(HK_PROJECT)
);

-- Satellite für Zeiteintrag-Details (bitemporal)
-- Hängt am Link, da die Details zum spezifischen Zeiteintrag gehören
CREATE TABLE S_TIMEENTRY_DETAILS (
    HK_USER_PROJECT_TIMEENTRY BYTEA NOT NULL, -- Fremdschlüssel zu L_USER_PROJECT_TIMEENTRY
    T_FROM TIMESTAMP NOT NULL,      -- Technischer Gültigkeitsbeginn (Teil des Primary Key)
    T_TO TIMESTAMP NULL,            -- Technisches Gültigkeitsende
    B_FROM DATE NOT NULL,           -- Fachlicher Gültigkeitsbeginn (kann dem ENTRY_DATE entsprechen)
    B_TO DATE NULL,                 -- Fachliches Gültigkeitsende (oft NULL für einzelne Ereignisse)
    REC_SRC VARCHAR(255) NOT NULL,    -- Quelle des Datensatzes
    ENTRY_DATE DATE NOT NULL,         -- Datum des Zeiteintrags
    START_TIME TIME NOT NULL,         -- Beginnzeit
    END_TIME TIME,                    -- Endzeit (kann optional sein)
    PAUSE_MINUTES INT,                -- Pause in Minuten (optional)
    WORK_LOCATION VARCHAR(255),       -- Arbeitsort
    DESCRIPTION TEXT,                 -- Beschreibung

    PRIMARY KEY (HK_USER_PROJECT_TIMEENTRY, T_FROM), -- Primärschlüssel für Historisierung
    FOREIGN KEY (HK_USER_PROJECT_TIMEENTRY) REFERENCES L_USER_PROJECT_TIMEENTRY(HK_USER_PROJECT_TIMEENTRY)
);

-- Satellite für das aktuell zugewiesene Projekt des Benutzers (bitemporal)
-- Hängt am Benutzer Hub, da dies eine Eigenschaft des Benutzers ist
CREATE TABLE S_USER_CURRENT_PROJECT (
    HK_USER BYTEA NOT NULL,     -- Fremdschlüssel zu H_USER
    T_FROM TIMESTAMP NOT NULL,        -- Technischer Gültigkeitsbeginn (Teil des Primary Key)
    T_TO TIMESTAMP NULL,                -- Technisches Gültigkeitsende
    B_FROM DATE NOT NULL,               -- Fachlicher Gültigkeitsbeginn (wann wurde das Projekt zugewiesen)
    B_TO DATE NULL,                     -- Fachliches Gültigkeitsende (wann wurde das Projekt geändert/entfernt)
    REC_SRC VARCHAR(255) NOT NULL,      -- Quelle des Datensatzes
    HK_PROJECT BYTEA NOT NULL,  -- Fremdschlüssel zu H_PROJECT (das aktuell zugewiesene Projekt)

    PRIMARY KEY (HK_USER, T_FROM), -- Primärschlüssel für Historisierung
    FOREIGN KEY (HK_USER) REFERENCES H_USER(HK_USER),
    FOREIGN KEY (HK_PROJECT) REFERENCES H_PROJECT(HK_PROJECT)
);

-- Tabelle für Anwendungs-Logs
CREATE TABLE APP_LOGS (
    LOG_ENTRY_ID SERIAL PRIMARY KEY, -- Technischer Primärschlüssel
    TIMESTAMP TIMESTAMP NOT NULL,     -- Zeitstempel des Ereignisses
    EVENT_TYPE VARCHAR(255) NOT NULL, -- Art des Ereignisses (z.B. 'login_success', 'registration_failed')
    HK_USER BYTEA NULL,               -- Optionaler Fremdschlüssel zu H_USER, falls relevant
    DETAILS JSONB NULL,               -- Zusätzliche Details im JSON-Format
    REC_SRC VARCHAR(255) NOT NULL     -- Quelle des Datensatzes (z.B. 'API')
);
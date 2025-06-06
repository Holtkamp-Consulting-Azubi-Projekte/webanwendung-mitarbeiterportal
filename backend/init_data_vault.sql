-- Backup der bestehenden Daten
-- CREATE TABLE backup_h_user AS SELECT * FROM h_user;
-- CREATE TABLE backup_h_project AS SELECT * FROM h_project;
-- CREATE TABLE backup_l_user_project_timeentry AS SELECT * FROM l_user_project_timeentry;
-- CREATE TABLE backup_s_user_details AS SELECT * FROM s_user_details;
-- CREATE TABLE backup_s_user_login AS SELECT * FROM s_user_login;
-- CREATE TABLE backup_s_project_details AS SELECT * FROM s_project_details;
-- CREATE TABLE backup_s_timeentry_details AS SELECT * FROM s_timeentry_details;
-- CREATE TABLE backup_s_user_current_project AS SELECT * FROM s_user_current_project;
-- CREATE TABLE backup_app_logs AS SELECT * FROM app_logs;

-- Löschen der bestehenden Tabellen (in korrekter Reihenfolge wegen Fremdschlüssel)
DROP TABLE IF EXISTS s_timeentry_details CASCADE;
DROP TABLE IF EXISTS s_user_current_project CASCADE;
DROP TABLE IF EXISTS s_project_details CASCADE;
DROP TABLE IF EXISTS s_user_login CASCADE;
DROP TABLE IF EXISTS s_user_details CASCADE;
DROP TABLE IF EXISTS l_user_project_timeentry CASCADE;
DROP TABLE IF EXISTS h_project CASCADE;
DROP TABLE IF EXISTS h_user CASCADE;
DROP TABLE IF EXISTS app_logs CASCADE;

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

-- Hub für Kunden
CREATE TABLE H_CUSTOMER (
    HK_CUSTOMER BYTEA PRIMARY KEY,              -- Hash Key, z. B. SHA-256 Hash vom Kundennamen
    CUSTOMER_NAME VARCHAR(255) UNIQUE NOT NULL, -- Name des Kunden
    T_FROM TIMESTAMP NOT NULL,                  -- Technischer Gültigkeitsbeginn
    T_TO TIMESTAMP NULL,                        -- Technisches Gültigkeitsende (NULL für aktive Einträge)
    REC_SRC VARCHAR(255) NOT NULL               -- Quelle des Datensatzes
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

-- Satellite für Projektdetails (bitemporal, erweitert für Verwaltungsseite)
CREATE TABLE S_PROJECT_DETAILS (
    HK_PROJECT BYTEA NOT NULL,         -- Fremdschlüssel zu H_PROJECT
    T_FROM TIMESTAMP NOT NULL,         -- Technischer Gültigkeitsbeginn (Teil des Primary Key)
    T_TO TIMESTAMP NULL,               -- Technisches Gültigkeitsende
    B_FROM DATE NOT NULL,              -- Fachlicher Gültigkeitsbeginn
    B_TO DATE NULL,                    -- Fachliches Gültigkeitsende
    REC_SRC VARCHAR(255) NOT NULL,     -- Quelle des Datensatzes
    PROJECT_NAME VARCHAR(255) NOT NULL,-- Redundant zum Hub, für Historisierung

    DESCRIPTION TEXT,                  -- Beschreibung des Projekts
    CUSTOMER_ID BYTEA,                 -- Fremdschlüssel zu H_CUSTOMER
    START_DATE DATE,                   -- Projektstart
    END_DATE DATE,                     -- Projektende (NULL = offen)
    BUDGET_DAYS INTEGER,               -- Budget in Tagen

    PRIMARY KEY (HK_PROJECT, T_FROM),
    FOREIGN KEY (HK_PROJECT) REFERENCES H_PROJECT(HK_PROJECT),
    FOREIGN KEY (CUSTOMER_ID) REFERENCES H_CUSTOMER(HK_CUSTOMER)
);

-- Satellite für Zeiteintrag-Details (bitemporal)
-- Hängt am Link, da die Details zum spezifischen Zeiteintrag gehören
CREATE TABLE S_TIMEENTRY_DETAILS (
    HK_USER_PROJECT_TIMEENTRY BYTEA NOT NULL, -- Fremdschlüssel zu L_USER_PROJECT_TIMEENTRY
    T_FROM TIMESTAMP NOT NULL,      -- Technischer Gültigkeitsbeginn (Teil des Primary Key)
    T_TO TIMESTAMP NULL,            -- Technisches Gültigkeitsende
    B_FROM DATE NOT NULL,           -- Fachlicher Gültigkeitsbeginn
    B_TO DATE NULL,                 -- Fachliches Gültigkeitsende
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
    B_FROM DATE NOT NULL,               -- Fachlicher Gültigkeitsbeginn
    B_TO DATE NULL,                     -- Fachliches Gültigkeitsende
    REC_SRC VARCHAR(255) NOT NULL,      -- Quelle des Datensatzes
    HK_PROJECT BYTEA NOT NULL,  -- Fremdschlüssel zu H_PROJECT (das aktuell zugewiesene Projekt)

    PRIMARY KEY (HK_USER, T_FROM), -- Primärschlüssel für Historisierung
    FOREIGN KEY (HK_USER) REFERENCES H_USER(HK_USER),
    FOREIGN KEY (HK_PROJECT) REFERENCES H_PROJECT(HK_PROJECT)
);

-- Satellite für Kundendetails (bitemporal)
CREATE TABLE S_CUSTOMER_DETAILS (
    HK_CUSTOMER BYTEA NOT NULL,                 -- Fremdschlüssel zum Hub
    T_FROM TIMESTAMP NOT NULL,                  -- Technischer Gültigkeitsbeginn
    T_TO TIMESTAMP NULL,                        -- Technisches Gültigkeitsende
    B_FROM DATE NOT NULL,                       -- Fachlicher Gültigkeitsbeginn
    B_TO DATE NULL,                             -- Fachliches Gültigkeitsende
    REC_SRC VARCHAR(255) NOT NULL,              -- Quelle des Datensatzes
    ADDRESS VARCHAR(255),                       -- Adresse des Kunden
    CONTACT_PERSON VARCHAR(255),                -- Ansprechpartner
    PRIMARY KEY (HK_CUSTOMER, T_FROM),
    FOREIGN KEY (HK_CUSTOMER) REFERENCES H_CUSTOMER(HK_CUSTOMER)
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

-- Wiederherstellung der Daten
-- INSERT INTO h_user SELECT * FROM backup_h_user;
-- INSERT INTO h_project SELECT * FROM backup_h_project;
-- INSERT INTO l_user_project_timeentry SELECT * FROM backup_l_user_project_timeentry;
-- INSERT INTO s_user_details SELECT * FROM backup_s_user_details;
-- INSERT INTO s_user_login SELECT * FROM backup_s_user_login;
-- INSERT INTO s_project_details SELECT * FROM backup_s_project_details;
-- INSERT INTO s_timeentry_details SELECT * FROM backup_s_timeentry_details;
-- INSERT INTO s_user_current_project SELECT * FROM backup_s_user_current_project;
-- INSERT INTO app_logs SELECT * FROM backup_app_logs;

-- Aufräumen der Backup-Tabellen
-- DROP TABLE backup_h_user;
-- DROP TABLE backup_h_project;
-- DROP TABLE backup_l_user_project_timeentry;
-- DROP TABLE backup_s_user_details;
-- DROP TABLE backup_s_user_login;
-- DROP TABLE backup_s_project_details;
-- DROP TABLE backup_s_timeentry_details;
-- DROP TABLE backup_s_user_current_project;
-- DROP TABLE backup_app_logs;
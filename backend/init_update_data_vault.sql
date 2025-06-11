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

-- KEINE DROP TABLES!
-- Nur CREATE TABLE IF NOT EXISTS und ALTER TABLE IF NOT EXISTS

-- Optional: Schema erstellen, falls nicht vorhanden
CREATE SCHEMA IF NOT EXISTS mitarbeiterportal;
SET search_path TO mitarbeiterportal;

-- Hub für Benutzer
CREATE TABLE IF NOT EXISTS h_user (
    hk_user UUID PRIMARY KEY,
    user_id VARCHAR(255) UNIQUE NOT NULL,
    t_from TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    t_to TIMESTAMP NULL,
    rec_src VARCHAR(255) NOT NULL
);

-- Hub für Projekte
CREATE TABLE IF NOT EXISTS h_project (
    hk_project UUID PRIMARY KEY,
    project_name VARCHAR(255) UNIQUE NOT NULL,
    t_from TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    t_to TIMESTAMP NULL,
    rec_src VARCHAR(255) NOT NULL
);

-- Hub für Kunden
CREATE TABLE IF NOT EXISTS h_customer (
    hk_customer UUID PRIMARY KEY,
    customer_name VARCHAR(255) UNIQUE NOT NULL,
    t_from TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    t_to TIMESTAMP NULL,
    rec_src VARCHAR(255) NOT NULL
);

-- Link, der Benutzer, Projekt und Zeiteintrag verbindet
CREATE TABLE IF NOT EXISTS l_user_project_timeentry (
    hk_user_project_timeentry UUID PRIMARY KEY,
    hk_user UUID NOT NULL,
    hk_project UUID NOT NULL,
    timeentry_id VARCHAR(255),
    t_from TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    t_to TIMESTAMP NULL,
    rec_src VARCHAR(255) NOT NULL,
    FOREIGN KEY (hk_user) REFERENCES h_user(hk_user),
    FOREIGN KEY (hk_project) REFERENCES h_project(hk_project)
);

-- Satellite für Benutzerdetails (bitemporal)
CREATE TABLE IF NOT EXISTS s_user_details (
    hk_user UUID NOT NULL,
    t_from TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    t_to TIMESTAMP NULL,
    b_from DATE NOT NULL DEFAULT CURRENT_DATE,
    b_to DATE NULL,
    rec_src VARCHAR(255) NOT NULL,
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    position VARCHAR(255),
    core_hours VARCHAR(255),
    telefon VARCHAR(255),
    is_admin BOOLEAN DEFAULT FALSE,
    PRIMARY KEY (hk_user, t_from),
    FOREIGN KEY (hk_user) REFERENCES h_user(hk_user)
);

ALTER TABLE s_user_details ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- Satellite für Benutzer-Anmeldedaten (bitemporal)
CREATE TABLE IF NOT EXISTS s_user_login (
    hk_user UUID NOT NULL,
    t_from TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    t_to TIMESTAMP NULL,
    b_from DATE NOT NULL DEFAULT CURRENT_DATE,
    b_to DATE NULL,
    rec_src VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    PRIMARY KEY (hk_user, t_from),
    FOREIGN KEY (hk_user) REFERENCES h_user(hk_user)
);

-- Satellite für Projektdetails (bitemporal)
CREATE TABLE IF NOT EXISTS s_project_details (
    hk_project UUID NOT NULL,
    t_from TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    t_to TIMESTAMP NULL,
    b_from DATE NOT NULL DEFAULT CURRENT_DATE,
    b_to DATE NULL,
    rec_src VARCHAR(255) NOT NULL,
    project_name VARCHAR(255) NOT NULL,
    description TEXT,
    customer_id UUID,
    start_date DATE,
    end_date DATE,
    budget_days INTEGER,
    PRIMARY KEY (hk_project, t_from),
    FOREIGN KEY (hk_project) REFERENCES h_project(hk_project),
    FOREIGN KEY (customer_id) REFERENCES h_customer(hk_customer)
);

-- Satellite für Zeiteintrag-Details (bitemporal)
CREATE TABLE IF NOT EXISTS s_timeentry_details (
    hk_user_project_timeentry UUID NOT NULL,
    t_from TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    t_to TIMESTAMP NULL,
    b_from DATE NOT NULL DEFAULT CURRENT_DATE,
    b_to DATE NULL,
    rec_src VARCHAR(255) NOT NULL,
    entry_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME,
    pause_minutes INT,
    work_location VARCHAR(255),
    description TEXT,
    PRIMARY KEY (hk_user_project_timeentry, t_from),
    FOREIGN KEY (hk_user_project_timeentry) REFERENCES l_user_project_timeentry(hk_user_project_timeentry)
);

-- Satellite für das aktuell zugewiesene Projekt des Benutzers (bitemporal)
CREATE TABLE IF NOT EXISTS s_user_current_project (
    hk_user UUID NOT NULL,
    t_from TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    t_to TIMESTAMP NULL,
    b_from DATE NOT NULL DEFAULT CURRENT_DATE,
    b_to DATE NULL,
    rec_src VARCHAR(255) NOT NULL,
    hk_project UUID NOT NULL,
    PRIMARY KEY (hk_user, t_from),
    FOREIGN KEY (hk_user) REFERENCES h_user(hk_user),
    FOREIGN KEY (hk_project) REFERENCES h_project(hk_project)
);

-- Satellite für Kundendetails (bitemporal)
CREATE TABLE IF NOT EXISTS s_customer_details (
    hk_customer UUID NOT NULL,
    t_from TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    t_to TIMESTAMP NULL,
    b_from DATE NOT NULL DEFAULT CURRENT_DATE,
    b_to DATE NULL,
    rec_src VARCHAR(255) NOT NULL,
    address VARCHAR(255),
    contact_person VARCHAR(255),
    PRIMARY KEY (hk_customer, t_from),
    FOREIGN KEY (hk_customer) REFERENCES h_customer(hk_customer)
);

-- Tabelle für Anwendungs-Logs
CREATE TABLE IF NOT EXISTS app_logs (
    log_entry_id SERIAL PRIMARY KEY,
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    event_type VARCHAR(255) NOT NULL,
    hk_user UUID NULL,
    details JSONB NULL,
    rec_src VARCHAR(255) NOT NULL
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
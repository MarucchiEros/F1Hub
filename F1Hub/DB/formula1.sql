-- Eliminazione del database se esiste
DROP DATABASE IF EXISTS Formula1;

-- Creazione del database
CREATE DATABASE Formula1;

-- Utilizzo del database
USE Formula1;

-- Eliminazione delle tabelle se esistono
DROP TABLE IF EXISTS piloti;
DROP TABLE IF EXISTS piste;
DROP TABLE IF EXISTS scuderie;
DROP TABLE IF EXISTS utenti;
DROP TABLE IF EXISTS preferiti;

-- Creazione della tabella Scuderie
CREATE TABLE scuderie (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL UNIQUE,
    sede VARCHAR(100) NOT NULL,
    anno_fondazione INT
);

-- Creazione della tabella Piste
CREATE TABLE piste (
    id INT AUTO_INCREMENT PRIMARY KEY,
    paese VARCHAR(50) NOT NULL,
    lunghezza DECIMAL(6,2) NOT NULL,
    anno_inaugurazione INT NOT NULL,
    numero_curve INT NOT NULL
);

-- Creazione della tabella Utenti con campo per admin
CREATE TABLE utenti (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password CHAR(64) NOT NULL,
    is_admin TINYINT(1) DEFAULT 0, 
    data_registrazione TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Creazione della tabella Piloti
CREATE TABLE piloti (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(50) NOT NULL,
    cognome VARCHAR(50) NOT NULL,
    numero INT NOT NULL,
    scuderia_id INT,
    mondiali_vinti INT DEFAULT 0,
    data_nascita DATETIME,
    nazionalità VARCHAR(50),
    FOREIGN KEY (scuderia_id) REFERENCES scuderie(id)
);


-- Creazione della tabella Preferiti
CREATE TABLE preferiti (
    id INT AUTO_INCREMENT PRIMARY KEY,
    utente_id INT,
    scuderia_id INT,
    pilota_id INT,
    pista_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);




-- Inserimento dati nelle scuderie
INSERT INTO scuderie (nome, sede, anno_fondazione) VALUES
('Alpine', 'Enstone, Regno Unito', 2005),
('Aston Martin', 'Silverstone, Regno Unito', 2021),
('Ferrari', 'Maranello, Italia', 1929),
('Haas', 'Kannapolis, Stati Uniti', 2014),
('Kick', 'Sede sconosciuta', 2023),
('Sauber', 'Hinwil, Svizzera', 1970),
('McLaren', 'Woking, Regno Unito', 1963),
('Mercedes', 'Brackley, Regno Unito', 2010),
('RB', 'Milton Keynes, Regno Unito', 2005),
('Red Bull Racing', 'Milton Keynes, Regno Unito', 2005),
('Williams', 'Grove, Regno Unito', 1977);

-- Inserimento dati nelle piste
INSERT INTO piste (paese, lunghezza, anno_inaugurazione, numero_curve) VALUES
('Bahrain', 5.41, 2004, 15),
('Arabia Saudita', 6.17, 2021, 27),
('Australia', 5.28, 1996, 16),
('Giappone', 5.81, 2000, 18),
('Cina', 5.45, 2004, 16),
('Miami', 5.41, 2022, 19),
('Emilia Romagna', 4.91, 2020, 63),
('Monaco', 3.34, 1929, 19),
('Canada', 4.36, 1978, 14),
('Spagna', 4.66, 1991, 16),
('Austria', 4.32, 1997, 10),
('Gran Bretagna', 5.89, 1950, 18),
('Ungheria', 4.38, 1986, 14),
('Belgio', 7.00, 1925, 20),
('Olanda', 4.26, 2021, 14),
('Italia', 5.79, 1950, 14),
('Azerbaijan', 6.00, 2016, 20),
('Singapore', 5.06, 2008, 23),
('Austin', 5.51, 2012, 20),
('Messico', 4.30, 2015, 17),
('Brasile', 4.31, 1973, 15),
('Las Vegas', 6.12, 2023, 14),
('Qatar', 5.42, 2021, 16),
('Abu Dhabi', 5.28, 2009, 21);

-- Inserimento dati nei piloti
INSERT INTO piloti (nome, cognome, numero, scuderia_id, mondiali_vinti, data_nascita, nazionalità) VALUES
('Alexander', 'Albon', 23, 1, 0, '1996-03-05', 'Thailandia'),
('Fernando', 'Alonso', 14, 2, 2, '1981-07-29', 'Spagna'),
('Valtteri', 'Bottas', 77, 3, 0, '1989-08-28', 'Finlandia'),
('Franco', 'Colapinto', 45, 4, 0, '2003-05-06', 'Argentina'),
('Pierre', 'Gasly', 10, 1, 0, '1996-02-07', 'Francia'),
('Lewis', 'Hamilton', 44, 8, 7, '1985-01-07', 'Gran Bretagna'),
('Nico', 'Hülkenberg', 27, 5, 0, '1987-08-19', 'Germania'),
('Liam', 'Lawson', 30, 4, 0, '2003-01-14', 'Nuova Zelanda'),
('Charles', 'Leclerc', 16, 2, 0, '1997-10-16', 'Monaco'),
('Kevin', 'Magnussen', 20, 4, 0, '1992-10-05', 'Danimarca'),
('Lando', 'Norris', 4, 8, 0, '1999-11-13', 'Gran Bretagna'),
('Esteban', 'Ocon', 31, 1, 0, '1996-09-17', 'Francia'),
('Sergio', 'Pérez', 11, 2, 0, '1990-01-26', 'Messico'),
('Oscar', 'Piastri', 81, 4, 0, '2001-04-06', 'Australia'),
('George', 'Russell', 63, 8, 0, '1998-02-15', 'Gran Bretagna'),
('Carlos', 'Sainz', 55, 2, 0, '1994-09-01', 'Spagna'),
('Lance', 'Stroll', 18, 2, 0, '1998-10-29', 'Canada'),
('Yuki', 'Tsunoda', 22, 5, 0, '2000-05-11', 'Giappone'),
('Max', 'Verstappen', 33, 9, 2, '1997-09-30', 'Paesi Bassi'),
('Zhou', 'Guanyu', 24, 4, 0, '1993-05-30', 'Cina');

-- Inserimento dati in utenti
INSERT INTO utenti (username, password, is_admin) VALUES
('admin', '$2y$10$aj9GIdtAOYbJ1oxntUKdLe9QrVfbmU9.wC9QOX87.i6dGyCBef9B2', 1);
INSERT INTO utenti (username, password, is_admin) VALUES
('user', '$2a$12$LlVVBpQzRYELHUmXEjASC.eu0qbgJIdIo/.4YgZWyVrT4xZhnzepm', 0);

-- Selezione per verificare i dati
SELECT * FROM utenti;
SELECT * FROM scuderie;
SELECT * FROM piste;
SELECT * FROM piloti;
SELECT * FROM preferiti;

SELECT piloti.id, piloti.nome, piloti.cognome, piloti.numero, 
       DATE(piloti.data_nascita) AS data_nascita, 
       piloti.mondiali_vinti, 
       piloti.nazionalità, 
       scuderie.nome AS scuderia_nome
FROM piloti
LEFT JOIN scuderie ON piloti.scuderia_id = scuderie.id;
CREATE DATABASE birding;

-- \c into birding DATABASE

CREATE TABLE notes (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL,
  flocksize INTEGER,
  user_id INTEGER,
  species_id INTEGER
);

create TABLE users (
id SERIAL PRIMARY KEY,
name VARCHAR(255),
email VARCHAR(255),
password VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS species (
    id SERIAL PRIMARY KEY,
    name TEXT,
    scientific_name TEXT
);

CREATE TABLE IF NOT EXISTS note_behaviours (id SERIAL PRIMARY KEY, note_id INTEGER, behaviour_id INTEGER);

CREATE TABLE IF NOT EXISTS behaviours (id SERIAL PRIMARY KEY, name TEXT);

CREATE TABLE IF NOT EXISTS comments (id SERIAL PRIMARY KEY, user_id INTEGER, note_id INTEGER, description TEXT);


SELECT name FROM behaviours INNER JOIN note_behaviours on behaviours.id=behaviour_id

SELECT name FROM species INNER JOIN notes on species.id = species_id WHERE notes.id =1;

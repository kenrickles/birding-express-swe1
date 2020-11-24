CREATE DATABASE birding;

-- \c into birding DATABASE

CREATE TABLE notes (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL,
  behaviour TEXT,
  flocksize INTEGER
);

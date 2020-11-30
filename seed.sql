INSERT INTO notes (date, flocksize, user_id, species_id) VALUES ('01/01/19', 2, 1, 1);
INSERT INTO notes (date, flocksize, user_id, species_id) VALUES ('02/04/19', 3, 2, 3);
INSERT INTO notes (date, flocksize, user_id, species_id) VALUES ('03/04/20', 4, 1, 2);


INSERT INTO users (email, password) VALUES ('test1@gmail.com', 'password');
INSERT INTO users (email, password) VALUES ('test2@gmail.com', 'password');
INSERT INTO users (email, password) VALUES ('test3@gmail.com', 'password');
INSERT INTO users (email, password) VALUES ('test4@gmail.com', 'password');

INSERT INTO species (name, scientific_name) VALUES ('Wandering Whistling Duck', 'Dendrocygna arcuata');
INSERT INTO species (name, scientific_name) VALUES ('Eurasian Wigeon', 'Anas penelope');
INSERT INTO species (name, scientific_name) VALUES ('Cinnamon Bittern', 'Tachybaptus ruficollis');
INSERT INTO species (name, scientific_name) VALUES ('Black Bittern', 'Dupetor flavicollis');

INSERT INTO note_behaviours (note_id, behaviour_id) VALUES (1, 2);
INSERT INTO note_behaviours (note_id, behaviour_id) VALUES (2, 1);
INSERT INTO note_behaviours (note_id, behaviour_id) VALUES (3, 3);
INSERT INTO note_behaviours (note_id, behaviour_id) VALUES (4, 4);
INSERT INTO note_behaviours (note_id, behaviour_id) VALUES (5, 1);
INSERT INTO note_behaviours (note_id, behaviour_id) VALUES (6, 4);
INSERT INTO note_behaviours (note_id, behaviour_id) VALUES (6, 5);


INSERT INTO behaviours (name) VALUES ('flying');
INSERT INTO behaviours (name) VALUES ('shitting');
INSERT INTO behaviours (name) VALUES ('eating');
INSERT INTO behaviours (name) VALUES ('sleeping');

INSERT INTO comments (note_id, user_id, description) VALUES (1, 2, 'interesting');
INSERT INTO comments (note_id, user_id, description) VALUES (1, 3, 'awesome!');
INSERT INTO comments (note_id, user_id, description) VALUES (2, 4, 'This is cool');



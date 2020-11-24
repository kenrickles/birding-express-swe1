import express from 'express';
import methodOverride from 'method-override';
import pg from 'pg';

// set the way we will connect to the server
const { Pool } = pg;
const pgConnectionConfigs = {
  user: process.env.USER,
  host: 'localhost',
  database: 'birding',
  port: 5432, // Postgres server always runs on this port by default
};
const pool = new Pool(pgConnectionConfigs);

// start express and create an express app
const app = express();
// setting the port number
const PORT = 3004;
// overiding post to allow ?method = put or delete
app.use(methodOverride('_method'));
// allow the use of `the folder public
app.use(express.static('public'));
// set the view engine to ejs
app.set('view engine', 'ejs');
// accepting request to form the data
app.use(express.urlencoded({ extended: false }));

/* ======= ROUTES ===== */
// Render a form that will create a new note.

app.get('/note', (req, res) => {
  res.render('newNote');
});

// Accept a POST request to create a new note.
app.post('/note', (req, res) => {
  const { date, behaviour, flockSize } = req.body;
  const inputValue = [date, behaviour, flockSize];
  const sqlQuery = 'INSERT INTO notes (date, behaviour, flocksize) VALUES ($1, $2, $3) RETURNING *';
  const whenQueryDone = (error, result) => {
    if (error) {
      console.log('Error executing query', error.stack);
      res.status(503).send(`error 503: service unavilable.<br /> ${result.rows}`);
      return;
    }
    console.log(result);
    res.redirect(`/note/${result.rows[0].id}`);
  };
  pool.query(sqlQuery, inputValue, whenQueryDone);
});

// Render a single note to /note/:id
app.get('/note/:id', (req, res) => {
  const { id } = req.params;
  // sql for selecting existing note
  const sqlNoteQuery = `SELECT * FROM notes where id=${id}`;
  const whenNoteQueryDone = (error, result) => {
    if (error) {
      console.log('Error');
      res.status(503).send('503 Error');
      return;
    }
    // note to be displayed
    const note = result.rows[0];
    const noteData = { note };
    res.render('note', noteData);
  };
  pool.query(sqlNoteQuery, whenNoteQueryDone);
});

// Render a list of notes to /
app.get('/', (req, res) => {
  const allNotesQuery = 'SELECT * FROM notes';
  const whenAllNotesQueryDone = (error, result) => {
    if (error) {
      console.log('error');
      res.status(503).send('404 error');
      return;
    }
    const notes = result.rows;
    const notesData = { notes };
    res.render('allNotes', notesData);
  };
  pool.query(allNotesQuery, whenAllNotesQueryDone);
});

app.listen(PORT, () => {
  console.log(`server is listening on port ${PORT}`);
});

import express from 'express';
import methodOverride from 'method-override';
import pg from 'pg';
import cookieParser from 'cookie-parser';
import jsSHA from 'jssha';
import flash from 'express-flash';
import session from 'express-session';
// Storing the Salt
const SALT = process.env.MY_ENV_VAR;
// set the way we will connect to the server
const { Pool } = pg;
let poolConfig;
if (process.env.ENV === 'PRODUCTION') {
  poolConfig = {
    user: 'postgres',
    // set DB_PASSWORD as an environment variable for security.
    password: process.env.DB_PASSWORD,
    host: 'localhost',
    database: 'birding',
    port: 5432,
  };
} else {
  poolConfig = {
    user: process.env.USER,
    host: 'localhost',
    database: 'birding',
    port: 5432, // Postgres server always runs on this port
  };
}
// Create a new instance of Pool object
const pool = new Pool(poolConfig);

// start express and create an express app
const app = express();
// setting the port number
const PORT = process.argv[2];
// overiding post to allow ?method = put or delete
app.use(methodOverride('_method'));
// allow the use of `the folder public
app.use(express.static('public'));
// set the view engine to ejs
app.set('view engine', 'ejs');
// accepting request to form the data
app.use(express.urlencoded({ extended: false }));
// middleware that allows cookies to be parsed
app.use(cookieParser());
// use to flash message back
app.use(session({
  /* the longer key it is the more random it is, the more secure it is.
  The key we want to keep secret, encrypt the information we store in the session */
  secret: 'secret',
  // If nothing is changed, we will not resave
  resave: false,
  // Do we want to save session details if there is no value placed in the session
  saveUninitialized: false,
}));
app.use(flash());
/* ======= ROUTES ===== */
// Render a form that will create a new note.

app.get('/note', (req, res) => {
  if (req.cookies.loggedIn === undefined) {
    res.redirect('errorPage');
    return;
  }
  pool.query('SELECT * FROM species', (error, sResults) => {
    if (error) {
      console.log(sResults);
      throw error;
    }
    pool.query('SELECT * FROM behaviours', (err, bResults) => {
      if (err) {
        console.log(bResults);
        throw err;
      }
      const noteData = { species: sResults.rows, behaviours: bResults.rows };
      res.render('newNote', noteData);
    });
  });
});

// Accept a POST request to create a new note.
app.post('/note', (req, res) => {
  // validate the login
  if (req.cookies.loggedIn === undefined) {
    res.redirect('errorPage');
    return;
  }
  const { date, flockSize, speciesId } = req.body;
  // get userId value from user cookies
  const { userId } = req.cookies;
  const inputValue = [date, flockSize, speciesId, userId];
  const sqlQuery = 'INSERT INTO notes (date, flocksize, species_id, user_id) VALUES ($1, $2, $3, $4) RETURNING *';
  const whenQueryDone = (error, result) => {
    if (error) {
      throw error;
    }
    const noteId = result.rows[0].id;
    // nested SQL to insert values in the note behaviour
    const secondQuery = 'INSERT INTO note_behaviours (note_id, behaviour_id) VALUES ($1, $2)';

    // using a loop to insert a query for each behaviour id
    const { behaviourIds } = req.body;
    behaviourIds.forEach((behaviourId, index) => {
      const inputBehaviourValues = [noteId, behaviourId];
      // second pool query
      pool.query(secondQuery, inputBehaviourValues, (insertionError, insertionResults) => {
        if (insertionError) {
          console.log(insertionResults);
          throw insertionError;
        }
        if (index === behaviourIds.length - 1) {
          res.redirect(`/note/${result.rows[0].id}`);
        }
      });
    });
  };
  pool.query(sqlQuery, inputValue, whenQueryDone);
});

// Render a single note to /note/:id
app.get('/note/:id', (req, res) => {
  const { id } = req.params;

  const commentsDisplay = (noteData) => {
    pool.query(`Select * FROM comments WHERE note_id=${id}`, (err, results) => {
      if (err) {
        console.log(results);
        throw err;
      }
      noteData.comments = results.rows;
      console.log(noteData);
      res.render('note', noteData);
    });
  };
  // sql for selecting existing note
  const sqlNoteQuery = `SELECT * FROM notes where id=${id}`;

  const whenNoteQueryDone = (error, result) => {
    if (error) {
      console.log('Error');
      throw (error);
    }
    // note to be displayed
    const note = result.rows[0];
    const noteData = { note };
    // select name of behaviour from table
    pool.query(`SELECT name FROM behaviours INNER JOIN note_behaviours on behaviours.id=behaviour_id WHERE note_behaviours.note_id =${id}`, (behaviourError, behaviourResult) => {
      if (behaviourError) {
        console.log(behaviourResult);
        throw behaviourError;
      }
      noteData.behaviour = behaviourResult.rows;
    });

    // select species name from table
    pool.query(`SELECT name FROM species INNER JOIN notes on species.id = species_id WHERE notes.id = ${id};`, (speciesError, speciesResult) => {
      if (speciesError) {
        console.log(speciesResult);
        throw speciesError;
      }
      noteData.species = speciesResult.rows[0];
      // run through comments again for render to bypass async and await nonsense
      commentsDisplay(noteData);
    });
  };
  pool.query(sqlNoteQuery, whenNoteQueryDone);
});

// Render posting a comment on a note
app.post('/note/:id/comment', (req, res) => {
  // retrieve note id
  const { id } = req.params;

  // retrieve user id from stored cookies
  const { userId } = req.cookies;

  // storing the comment
  const { comment } = req.body;

  // storing the req.body
  const commentValues = [id, userId, comment];

  // write sql query to insert new comment
  const commentSQL = 'INSERT INTO comments (note_id, user_id, description) VALUES ($1, $2, $3)';

  // callback for sql query to insert new comment
  const commentSQLCallBack = (error, result) => {
    if (error) {
      console.log(result);
      throw error;
    }
    // redirect the user back to the note with updated comments
    res.redirect(`/note/${id}`);
  };

  // execute sql query to insert new comment
  pool.query(commentSQL, commentValues, commentSQLCallBack);
});

// Render a list of notes to main page
app.get('/', (req, res) => {
  if (req.cookies.loggedIn === undefined) {
    res.redirect('errorPage');
    return;
  }
  // select the data
  const allNotesQuery = 'SELECT notes.id, notes.date, notes.flocksize, species.name AS species_name from notes INNER JOIN species ON notes.species_id = species.id';
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

app.delete('/note/:id/delete', (req, res) => {
  // storing the id from user request
  const { id } = req.params;
  // delete query
  const deleteSQL = (`DELETE FROM notes where id=${id}`);
  // query to delete from table
  pool.query(deleteSQL, (error, result) => {
    if (error) {
      console.log(result);
      throw error;
    }
    // redirect back to home page
    res.redirect('/');
  });
});
// render error page
app.get('/errorpage', (req, res) => {
  res.render('errorPage');
});
// Render a form for user sign up
app.get('/signup', (req, res) => {
  res.render('register');
});
app.post('/signup', (req, res) => {
  const {
    name, email, password, password2,
  } = req.body;
  const errors = [];
  // validation for all fields being filled up
  if (!name || !email || !password || !password2) {
    errors.push({ message: 'Please enter all fields' });
  }
  // password character at least 6 validation
  if (password.length < 6) {
    errors.push({ message: 'Password Should be at least 6 characters' });
  }
  // making sure password matches
  if (password !== password2) {
    errors.push({ message: 'Passwords do not match' });
  }
  // if there are are errors, use flash to display errors.
  if (errors.length > 0) {
    res.render('register', { errors });
  } else {
    // form validation has passed
    // initialise the SHA object
    const shaObj = new jsSHA('SHA-512', 'TEXT', { encoding: 'UTF8' });
    // input the password from the request to the SHA object
    shaObj.update(req.body.password);
    // get the hashed password as output from the SHA object
    const hashedPassword = shaObj.getHash('HEX');

    console.log(hashedPassword);
    // store the hashed password in our DB

    pool.query(
      `SELECT * FROM users
      WHERE email = $1`, [email], (error, result) => {
        if (error) {
          throw error;
        }
        console.log(result.rows);
        // validation to see if email has been registered
        if (result.rows.length > 0) {
          errors.push({ message: 'Email already registered' });
          res.render('register', { errors });
        } else {
          // insert into database
          pool.query(
            `INSERT INTO users (name, email, password)
            VALUES ($1, $2, $3)
            RETURNING id, password`, [name, email, hashedPassword], (err, results) => {
              if (err) {
                throw err;
              }
              console.log(results.rows);
              req.flash('success_msg', 'You are now registered. Please log in');
              res.redirect('/login');
            },
          );
        }
      },

    );
  }
});

app.get('/login', (req, res) => {
  res.render('login');
});

app.post('/login', (req, res) => {
  const values = [req.body.email];
  pool.query('SELECT * from users WHERE email=$1', values, (error, result) => {
    // return if there is a query error
    if (error) {
      console.log('Error executing query', error.stack);
      res.status(503).send(result.rows);
      return;
    }
    const errors = [];
    // we didnt find a user with that email
    if (result.rows.length === 0) {
      // the error for incorrect email and incorrect password are the same for security reasons.
      // This is to prevent detection of whether a user has an account for a given service.
      errors.push({ message: 'Incorrect Credentials' });
      res.render('login', { errors });
      return;
    }
    const user = result.rows[0];
    // create new SHA object for user id
    const shaObj = new jsSHA('SHA-512', 'TEXT', { encoding: 'UTF8' });
    shaObj.update(req.body.password);
    // generate a hashed password
    const hashedPassword = shaObj.getHash('HEX');
    if (user.password !== hashedPassword) {
      errors.push({ message: 'Incorrect Credentials' });
      res.render('login', { errors });
      return;
    } if (user.password === hashedPassword) {
      // SHA object for user id
      const shaObjUserId = new jsSHA('SHA-512', 'TEXT', { encoding: 'UTF8' });
      // create an unhashed cookie string based on user ID and salt
      const unhasedUseridString = `${user.id}-${SALT}`;
      console.log('unhashed cookie string:', unhasedUseridString);
      // input the unhashed cookie string to the SHA object
      shaObjUserId.update(unhasedUseridString);
      // generate a hashed cookie string using SHA object
      const hashedUserIdCookieString = shaObjUserId.getHash('HEX');
      // set the loggedInHash and userId cookies in the response
      res.cookie('loggedInHash', hashedUserIdCookieString);
      res.cookie('userId', user.id);
    }
    // The user's password hash matches that in the DB and we authenticate the user.
    res.cookie('loggedIn', true);
    // redirect
    res.redirect('/');
  }); });
app.delete('/logout', (req, res) => {
  console.log('request to logout came in');
  // clear all the cookies
  res.clearCookie('userId');
  res.clearCookie('loggedInHash');
  res.clearCookie('loggedIn');
  // redirect to login page
  res.redirect('/login');
});
app.listen(PORT, () => {
  console.log(`server is listening on port ${PORT}`);
});

require('dotenv').config();

const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const express = require('express');
const favicon = require('serve-favicon');
// const hbs = require('hbs');
const mongoose = require('mongoose');
const logger = require('morgan');
const path = require('path');
const cors = require('cors');

const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const flash = require('connect-flash');


mongoose
  .connect(process.env.MONGODB_URI, { useNewUrlParser: true })
  .then((x) => {
    console.log(`Connected to Mongo! Database name: "${x.connections[0].name}"`);
  })
  .catch((err) => {
    console.error('Error connecting to mongo', err);
  });

const app_name = require('./package.json').name;
const debug = require('debug')(`${app_name}:${path.basename(__filename).split('.')[0]}`);

const app = express();

app.use(cors({
  credentials: true,
  origin: ['http://localhost:3000'],
}));

// Middleware Setup
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());


// Express View engine setup
app.set('views', path.join(__dirname, 'views'));
// app.set('view engine', 'hbs');
app.use(express.static(path.join(__dirname, 'public')));
app.use(favicon(path.join(__dirname, 'public', 'images', 'favicon.ico')));

// Enable authentication using session + passport
app.use(session({
  secret: 'ink-inc',
  resave: true,
  saveUninitialized: true,
  store: new MongoStore({ mongooseConnection: mongoose.connection }),
}));
app.use(flash());


require('./passport')(app);


const index = require('./routes/index');
const authRoutes = require('./routes/auth');
const artistRoutes = require('./routes/artist');
const tattooRoutes = require('./routes/tattoo');
const userRoutes = require('./routes/user');
const chatRoutes = require('./routes/chat');

app.use('/', index);
app.use('/api', authRoutes);
app.use('/api', artistRoutes);
app.use('/api', tattooRoutes);
app.use('/api', userRoutes);
app.use('/api', chatRoutes);

app.use((req, res, next) => {
  // If no routes match, send them the React HTML.
  res.sendFile(`${__dirname  }/public/index.html`);
});

module.exports = app;

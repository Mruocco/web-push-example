const express = require('express');
const app = express();
const path = require('path');
const bodyParser = require('body-parser');
const webpush = require('web-push');

app.enable('trust proxy');

// redirection from http to https
app.use((req, res, next) => {

  next();
/*  if (req.secure || req.headers.host === `localhost:${PORT}`) {
    next();
  } else {
    res.redirect('http://' + req.headers.host + req.url);
  }*/
});

// lowdb is a small single file database
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');

// create database file and open new database
const adapter = new FileSync('db.json');
const db = low(adapter);

// set default field for user subscriptions and some data
db.defaults({
  payload: {
    "title": "TESTEST",
    "icon": "https://image.flaticon.com/icons/svg/222/222401.svg",
    "image": "https://ssl.cdn-redfin.com/system_files/media/141111_JPG/genLdpUgcMediaBrowserUrl/item_2.jpg",
    "badge": "https://cdn3.iconfinder.com/data/icons/pyconic-icons-1-2/512/badge-512.png"
  //  "vibrate": "<Array of Integers>",
//    "sound": "<URL String>",
  },
  subs: {}
}).write();

// read .env file
require('dotenv').config();

// remember to set port and domain in your .env file
const PORT = process.env.PORT || 5500;
const DOMAIN = process.env.DOMAIN || 'localhost:';

// check if vapid keys were set
if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
  // if not, generate keys and log them in the console
  // vapid keys should be generated only once
  const vapidKeys = webpush.generateVAPIDKeys();
  function formatVapid() {
    return `
    VAPID_PUBLIC_KEY=${vapidKeys.publicKey}
    VAPID_PRIVATE_KEY=${vapidKeys.privateKey}
    `
  }
  console.log('update your .env file with following VAPID keys: ', formatVapid());
  return
}

// set domain and vapid keys from process.env
webpush.setVapidDetails(
  'http://' + DOMAIN,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

// serve public folder as static files
app.use(express.static('./public/src'));
app.use(bodyParser.json());

// serve main html page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname + '/public/src/index.html'));
});

// route to get public vapid key
app.get('/vapidKey', (req, res) => {
  res.send(process.env.VAPID_PUBLIC_KEY);
});

// function for sending notification
function sendNotification(subscription) {
  console.log(subscription);
  webpush.sendNotification(subscription)
    .catch((err) => {
      if (err.statusCode === 410) {
        console.error('removing sub')
        db.unset(`subs["${subscription.endpoint}"]`).value();
        db.write();
      }
    });
}

app.post('/register', (req, res) => {
  const sub = req.body.subscription;
  // put user subscription into database
  db.set(`subs["${sub.endpoint}"]`, sub).value();
  db.write();
  // send confirmation to client
  res.send("registered");
});

// this route is only for demo purposes, in real life situation notification would be triggered by some kind of server-side event
app.post('/notify', (req, res) => {
  const users = db.get('subs').value();
  if (users) {
    Object.values(users).forEach((el) => {
      console.log(el);
      sendNotification(el);
    })
  }
  res.send("notified");
});



app.get('/payload', (req, res) => {
  const payload = db.get('payload').value();
  res.send(payload);
});

app.post('/unsubscribe', (req, res) => {
  const sub = req.body;
  db.unset(`subs["${sub.endpoint}"]`).value();
  db.write();
  res.send('ok, get I it');
});

app.listen(PORT, () => console.log(`listening on ${PORT}`))

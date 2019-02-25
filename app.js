const express = require('express');
const app = express();
const port = 5500;
const path = require('path');
const bodyParser = require('body-parser');
const webpush = require('web-push');

// lowdb is a small single file database
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');

// create database file and open new database
const adapter = new FileSync('db.json');
const db = low(adapter);

// set default field for user subscriptions and some data
db.defaults({ 
  payload: {
    "title": "hello there",
    "body": "push body from server"
  },
  subs: {}
}).write();

// read .env file
require('dotenv').config();
// check if vapid keys were set
if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
  const vapidKeys = webpush.generateVAPIDKeys();
  // vapid keys should be generated only once
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
  'http://localhost:5500',
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
  webpush.sendNotification(subscription)
  .then((res) => {
    console.log('ok');
  })
  .catch((err) => {
    if (err.statusCode === 410) {
      console.error('removing subscription: ', err);
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
  console.log(sub);
  db.unset(`subs["${sub.endpoint}"]`).value();
  db.write();
  res.send('ok, get I it');
});

app.listen(port, () => console.log(`listening on ${port}`))
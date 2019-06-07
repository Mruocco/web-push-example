const express = require('express');
const webpush = require('web-push');
const cors = require('cors');
const bodyParser = require('body-parser');

VAPID_PUBLIC='BLNpZn9zBkhjm_mWlXnQY1R_bqdSOz3Oia4ObnGiA-Bbar9_G_GmZbNoQ-Jr1O-YjS4yQI-JfIHUfxrbo4nz25Q';
VAPID_PRIVATE='ZWLCuQdkTEe4F4-RwLdAuMtGoRoe4afz0rqvIuy7M4o';


const fakeDatabase = [];

const app = express();

app.use(cors());
app.use(bodyParser.json());

webpush.setVapidDetails('mailto:you@domain.com', VAPID_PUBLIC, VAPID_PRIVATE);

app.post('/subscription', (req, res) => {
  const subscription = req.body;
  fakeDatabase.push(subscription);
});

app.post('/sendNotification', (req, res) => {
  const notificationPayload = {
    notification: {
      title: 'New Notification',
      body: 'This is the body of the notification',
      icon: 'assets/icons/icon-512x512.png'
    }
  };

  const promises = [];
  fakeDatabase.forEach(subscription => {
    webpush.sendNotification(subscription, JSON.stringify(notificationPayload)).then((r)=>{
      console.log(r);
    }, (err)=>{
      console.warn(err);
    });
  });
  res.sendStatus(200);
});

app.listen(3000, () => {
  console.log('Server started on port 3000');
});

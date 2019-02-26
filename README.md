## Basic Web Push notifications implementation.

### How to use<br>
- run `npm i`
- run `node app` - to start server
- create `.env` file in the root folder and paste generated VAPID keys from the console
- also in `.env` You can specify custom `DOMAIN` and `PORT`
- run server again, and go to `http://localhost:5500`, or the `DOMAIN` and `PORT` from `.env` file

---

### How does this work?
<img src="/demo.png" alt="application User Interface" style="margin: 0 auto; width: 200px; box-shadow: 0 6px 12px #00000020"><br>
- when user visits the page, Service Worker is registered
- eventListener on 'push' event is added to Service Worker
- on 'subscribe', the user is asked to grant permissions for notifications
- if the permission is granted, VAPID keys are retrieve from `/vapidKey` route, user subscription object is created, send to `/register` on the server and saved in database
- on notify, server sends 'push' event to each subscribed user via endpoint from subscription object
- on 'push' event Service Worker displays notification in browser with data from `/payload` route
- on 'unsubscribe' user subscription is removed from database via `/unsubscribe` route

---
const getPayload = async () => {
  const res = await fetch('payload');
  return res.json();
}

self.addEventListener('push', async (event) => {
  const payload = await getPayload()
  self.registration.showNotification(payload.title, {
    body: payload.body
  });
});

self.addEventListener('notificationclick', (event) => {
  event.waitUntil(
    console.log(self.clients)
  )
})

self.addEventListener('pushsubscriptionchange', (event) => {
  console.log('Subscription expired');
  event.waitUntil(
    self.registration.pushManager.subscribe({ userVisibleOnly: true })
    .then((subscription) => {
      console.log('Subscribed after expiration', subscription.endpoint);
      return fetch('register', {
        method: 'post',
        headers: {
          'Content-type': 'application/json'
        },
        body: JSON.stringify({
          endpoint: subscription.endpoint
        })
      });
    })
  );
});
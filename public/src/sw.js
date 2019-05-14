const getPayload = async () => {
  const res = await fetch('payload');
  return res.json();
}

self.addEventListener('push', async (event) => {
  console.log('received');
  const payload = await getPayload()

  self.registration.showNotification(payload.title, {
    body: payload.body,
    icon: payload.icon,
    image: payload.image,
    tag: payload.tag
    data: payload.data,
    vibrate: [500, 100, 500],
  });
});

self.addEventListener('notificationclick', (event) => {
  event.waitUntil(
    self.clients.matchAll().then((clientList) => {
      event.notification.close();
      if (clientList.length > 0) {
        return clientList[0].focus();
      }
      return self.clients.openWindow('/');
    })
  );
});


self.addEventListener('pushsubscriptionchange', (event) => {
  console.log('Subscription expired');
  event.waitUntil(
    self.registration.pushManager.subscribe({
      userVisibleOnly: true
    })
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

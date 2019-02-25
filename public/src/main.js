const subscriptionButton = document.querySelector('.ask-for-permission');
const notify = document.querySelector('.notify-btn');
const subscriptionStatus = document.querySelector('.subscription-status');
const unsubscribeButton = document.querySelector('.unsubscribe-btn');

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js');
}

navigator.serviceWorker.ready
  .then(registration => registration.pushManager.getSubscription())
  .then(subscription => {
    subscription ? console.log('Already subscribed', subscription.endpoint) : subscriptionButton.removeAttribute('disabled');
  });

notify.addEventListener('click', sendPush);

function sendPush() {
  fetch('notify', {
      method: 'post',
      headers: {
        'Content-type': 'application/json'
      },
    })
    .then(res => res.text())
    .then(resTxt => console.log(resTxt));
}

subscriptionButton.addEventListener('click', subscribe);

function subscribe() {
  navigator.serviceWorker.ready
    .then(async (registration) => {
      // get vapid key from server
      const res = await fetch('vapidKey');
      const vapidPublicKey = await res.text();
      const Uint8ArrayVapidKey = urlBase64ToUint8Array(vapidPublicKey);

      return registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: Uint8ArrayVapidKey
      });
    }).then(subscription => {
      subscriptionButton.setAttribute('disabled', true);
      console.log('Subscribed', subscription.endpoint);
      return fetch('register', {
          method: 'post',
          headers: {
            'Content-type': 'application/json'
          },
          body: JSON.stringify({
            subscription: subscription
          })
        })
        .then(res => res.text())
        .then(res => console.log(res));
    }).catch(err => console.error(err));
}

unsubscribeButton.addEventListener('click', unsubscribe);

function unsubscribe() {
  navigator.serviceWorker.ready
    .then(registration => registration.pushManager.getSubscription())
    .then(subscription => subscription.unsubscribe()
      .then(() => {
        subscriptionButton.removeAttribute('disabled');
        return fetch('unsubscribe', {
            method: 'post',
            headers: {
              'Content-type': 'application/json'
            },
            body: JSON.stringify(subscription)
          })
          .then(res => res.text())
          .then(resTxt => console.log(resTxt));
      })
    )
    .catch(err => console.error('already unsubscribed: ', err));
}


function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
export default defineBackground(() => {
  console.log('iClickerNotifier is running in the background');

  browser.runtime.onMessage.addListener((message) => {
    switch (message.type) {
      case 'CLASS_STARTED':
        console.log('IClickerNotifier: Received CLASS_STARTED message from content script. Sending notification.');
        browser.notifications.create({
          type: 'basic',
          iconUrl: browser.runtime.getURL('/alert.png'),
          title: 'iClicker Class Started',
          message: 'Your instrutor has started the class.',
          priority: 2
        });
      case 'QUESTION_STARTED':
        console.log('IClickerNotifier: Received QUESTION_STARTED message from content script. Sending notification.');
        browser.notifications.create({
          type: 'basic',
          iconUrl: browser.runtime.getURL('/alert.png'),
          title: 'iClicker Question Started',
          message: 'Your instrutor has started a question.',
          priority: 2
        });
    }

    return false; //Indicate that the response is not being sent asynchronously
  });
});

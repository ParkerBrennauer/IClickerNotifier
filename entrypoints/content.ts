function listenForClassStart() {
  let notificationSent = false;

  const outerContainer = document.querySelector('.course-join-container');
  const joinButton = document.querySelector('#btnJoin');

  if (!outerContainer || !joinButton) {
    console.log('iClickerNotifier: DOM elements not found.');
    return;
  }

  const callback = (mutationList: MutationRecord[], observer: MutationObserver) => {
    for (const mutation of mutationList) {
      if (mutation.type === 'attributes') {
        //Check if accessibility attribute says the div is hidden.
        const isAriaHidden = outerContainer.getAttribute('aria-hidden') === 'true';

        //Get the DOMRect object of the outerContainer, which is the smallest rectangle that contains the entire element, including padding and border, but not margin.
        const rectangle = outerContainer.getBoundingClientRect();
        //IClicker hides the container by setting its height to 0.
        const hasVisibleArea = rectangle.height > 0;

        const isJoinButtonDisabled = joinButton.hasAttribute('disabled');

        if (!isAriaHidden && hasVisibleArea && !isJoinButtonDisabled && !notificationSent) {
          console.log('iClickerNotifier: IClicker Class has started.');
          //Send the notification to the background script to trigger the browser notification.
          browser.runtime.sendMessage({
            type: 'CLASS_STARTED',
            timestamp: Date.now()
          });
          notificationSent = true;
        } else if ((isAriaHidden || !hasVisibleArea || isJoinButtonDisabled) && notificationSent) {
          console.log('iClickerNotifier: IClicker Class has ended, resetting state.');
          notificationSent = false;
        }
      };
    }
  };
  const observer = new MutationObserver(callback);
  observer.observe(outerContainer, { attributes: true });
  observer.observe(joinButton, { attributes: true });
}

function listenForQuestionStart() {

}

export default defineContentScript({
  matches: ['*://*.iclicker.com/*'],

  main() {
    console.log('iClickerNotifier content script is running.');
    listenForClassStart();
  }
});

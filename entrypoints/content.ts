function waitForElement(selector: string): Promise<Element> {
    return new Promise((resolve) => {
        const existingElement = document.querySelector(selector);
        if (existingElement) {
            return resolve(existingElement);
        }

        const observer = new MutationObserver(() => {
            const element = document.querySelector(selector);
            if (element) {
                observer.disconnect();
                return resolve(element);
            }
        });

        observer.observe(document.body, { childList: true, subtree: true });
    });
}

function listenForClassStart() {
  const outerContainer = document.querySelector('.course-join-container');
  const joinButton = document.querySelector('#btnJoin');

  if (!outerContainer || !joinButton) {
    console.log('iClickerNotifier: DOM elements not found.');
    return;
  }

  const callback = (mutationList: MutationRecord[], observer: MutationObserver) => {

    for (const mutation of mutationList) {
      if (mutation.type === 'attributes') {
        if (mutation.target == outerContainer || mutation.target == joinButton) {
          //Check if accessibility attribute says the div is hidden.
          const isAriaHidden = outerContainer.getAttribute('aria-hidden') === 'true';

          const isJoinButtonDisabled = joinButton.hasAttribute('disabled');

          if (!isAriaHidden && !isJoinButtonDisabled) {
            console.log('iClickerNotifier: IClicker Class has started.');
            //Send the notification to the background script to trigger the browser notification.
            browser.runtime.sendMessage({
              type: 'CLASS_STARTED',
              timestamp: Date.now()
            });
            //Stop observing after detecting the class start to avoid multiple notifications.
            observer.disconnect();
            listenForQuestionStart();
          }
        }
      }
    }
  };

  const observer = new MutationObserver(callback);
  observer.observe(outerContainer, { attributes: true });
  observer.observe(joinButton, { attributes: true });

}

function listenForQuestionStart() {
  const pageWrapper = document.querySelector('#wrapper');

  if (!pageWrapper) {
    console.log('iClickerNotifier: Page wrapper element not found.');
    return;
  }

  const targetSelector = 'div[aria-live="polite"][role="alert"]';

  const callback = (mutationList: MutationRecord[], observer: MutationObserver) => {

    for (const mutation of mutationList) {
      if (mutation.type === 'childList') {

        for (const node of mutation.addedNodes) {
          if (node instanceof HTMLElement) {
            const targetFound = node.matches(targetSelector) || node.querySelector(targetSelector) !== null;

            if (targetFound) {
              browser.runtime.sendMessage({
                type: 'QUESTION_STARTED',
                timestamp: Date.now()
              });
              return;
            }
          }
        }
      }
    }
  };

  const observer = new MutationObserver(callback);
  observer.observe(pageWrapper, { childList: true, subtree: true });
}

export default defineContentScript({
  matches: ['*://*.iclicker.com/*'],

  async main() {
    console.log('iClickerNotifier content script is running.');
    await waitForElement('.course-join-container');
    await waitForElement('#btnJoin');
    listenForClassStart();
  }
});

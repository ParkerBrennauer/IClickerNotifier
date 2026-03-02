let classObserver: MutationObserver | null = null;
let questionObserver: MutationObserver | null = null;

function waitForElement(selector: string, timeoutMs: number = 10000): Promise<Element | null> {
    return new Promise((resolve) => {
        const existingElement = document.querySelector(selector);
        if (existingElement) {
            return resolve(existingElement);
        }
        let observer: MutationObserver | null = null;
        let timeoutId: ReturnType<typeof setTimeout>;
        
        const cleanup = () => {
          if (observer) observer.disconnect()
          clearTimeout(timeoutId);
        };

        timeoutId = setTimeout(() => {
          cleanup();
          resolve(null);
        }, timeoutMs);

        observer = new MutationObserver(() => {
            const element = document.querySelector(selector);
            if (element) {
                cleanup();
                resolve(element);
            }
        });

        observer.observe(document.body, { 
          childList: true, 
          subtree: true 
        });
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
          }
        }
      }
    }
  };

  if(classObserver) classObserver.disconnect();
  classObserver = new MutationObserver(callback);
  classObserver.observe(outerContainer, { attributes: true });
  classObserver.observe(joinButton, { attributes: true });
}

async function listenForQuestion() {
  const pageWrapper = await waitForElement('#wrapper');
  if (!pageWrapper){
    console.log("iClickerNotifer: Page wrapper not found");
    return;
  }

  const sendQuestionMessage = () => {
    browser.runtime.sendMessage({
      type: 'QUESTION_STARTED',
      timestamp: Date.now()
    }); 
  }

  const targetSelector = 'div[aria-live="polite"][role="alert"]';
  if (document.querySelector(targetSelector)){
    sendQuestionMessage();
    return
  }

  const callback = (mutationList: MutationRecord[], observer: MutationObserver) => {

    for (const mutation of mutationList) {
      if (mutation.type === 'childList') {

        for (const node of mutation.addedNodes) {
          if (node instanceof HTMLElement) {
            const targetFound = node.matches(targetSelector) || node.querySelector(targetSelector) !== null;

            if (targetFound) {
              sendQuestionMessage();
              observer.disconnect();
              return;
            }
          }
        }
      }
    }
  };

  if(questionObserver) questionObserver.disconnect();
  questionObserver = new MutationObserver(callback);
  questionObserver.observe(pageWrapper, { childList: true, subtree: true });
}

export default defineContentScript({
  matches: ['*://*.iclicker.com/*'],

  async main(ctx) {
    console.log('iClickerNotifier content script is running.');

    listenForClassStart();

    ctx.addEventListener(window, 'wxt:locationchange', async (event) => {
      const newUrl = event.newUrl.href

      if (newUrl.includes("/course/") && newUrl.includes("/overview")){
        await waitForElement('.course-join-container');
        await waitForElement('#btnJoin');
        listenForClassStart();
      }

      //Check if .question-data-container exists when on the checked in page.
      if (newUrl.includes("/class/") && newUrl.includes("/poll")){
        listenForQuestion();
      }
    })
  }
});

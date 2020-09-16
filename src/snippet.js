((w, d, script, url, strumKey) => {
  // setup queue so that commands can be sent before rum script is loaded
  const queue = [];
  // eslint-disable-next-line
  w[strumKey] = function() {
    // eslint-disable-next-line
    queue.push(arguments);
  };
  // eslint-disable-next-line
  w[strumKey].queue = queue;

  // Setup the performance observer, so we can get the long task and element timing
  // data before rum script is loaded.
  const longTasks = [];
  const timingElements = [];
  const inPageLoad = true;
  let observer;
  if (window.PerformanceObserver && window.PerformanceObserver.supportedEntryTypes &&
    (PerformanceObserver.supportedEntryTypes.indexOf('longtask') >= 0 ||
      PerformanceObserver.supportedEntryTypes.indexOf('element') >= 0)) {
    try {
      observer = new PerformanceObserver((l) => {
        l.getEntries().forEach((e) => {
          switch (e.entryType) {
            case 'element':
              timingElements.push(e);
              break;
            case 'longtask':
              longTasks.push(e);
              break;
            default:
              break;
          }
        });
      });
      observer.observe({ entryTypes: ['longtask', 'element'] });

      w[`${strumKey}lt`] = {
        longTasks,
        timingElements,
        inPageLoad,
        observer,
      };
      // eslint-disable-next-line no-empty
    } catch (ex) {}
  }

  // add rum script and let it load asynchronously so we don't block the rest of the
  // website from loading
  if (url) {
    const scriptEl = d.createElement(script);
    scriptEl.async = 1;
    scriptEl.src = url;

    // insert our script before any other scripts
    const firstScript = d.getElementsByTagName(script)[0];
    firstScript.parentNode.insertBefore(scriptEl, firstScript);
  }
})(window, document, 'script', 'the-script-url', 'strum' /* see constants.js */);

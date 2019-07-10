/* global it */

const harness = require('./utils/_harness');

harness('store-test', () => {
  it('Load app', () =>
    global.app.client
      .windowByIndex(0)
      .waitUntilWindowLoaded()
      .waitForVisible('[class^="c1"]'));
}, [
  '--testing=true',
]);

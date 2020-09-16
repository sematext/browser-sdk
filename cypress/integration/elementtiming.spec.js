/*
 * Copyright (c) Sematext Group, Inc.
 * All Rights Reserved
 *
 * THIS IS UNPUBLISHED PROPRIETARY SOURCE CODE OF Sematext Group, Inc.
 * The copyright notice above does not evidence any
 * actual or intended publication of such source code.
 */

describe('RUM Script Element Timing Tests', () => {
  it('Element Timing Present in Hard Page Load', () => {
    // open the e2e.html page
    cy.visit('/e2e.html?slow=1');

    // start the Cypress server to be able to stub responses
    cy.server();

    // define stubbed route for sampling
    cy.route({
      method: 'HEAD',
      url: '/sampling/*',
      status: 200,
      response: {},
      headers: {
        'X-Sematext-Experience-App-Active': true,
        'X-Sematext-Experience-Sampling-Active': false,
        'X-Sematext-Experience-Sampling-NextEvent': true,
        'X-Sematext-Experience-Sampling-Percentage': 100,
      },
    }).as('head');

    // define stubbed route for sending data
    cy.route({
      method: 'POST',
      url: '/api/v1/apps/8763d12d-1j3t-932v-b498-544290z98k43/data*',
      status: 200,
      response: {
        error: false,
        message: 'accepted event',
      },
    }).as('sendData');

    cy.route({
      method: 'GET',
      url: '/data#*',
      status: 200,
      response: {
        status: 'ok',
      },
    }).as('data');

    // next a page load should happen with timing element present
    // we skip first data request because it will contain ttfb
    cy.wait(['@sendData', '@sendData']).spread((_, xhr) => {
      assert.isNotNull(xhr.request.body);
      assert.isNotNull(xhr.request.body.body.pageLoad);

      // check if there are page loads present
      const pageLoads = xhr.request.body.body.pageLoad;
      assert.isAbove(pageLoads.length, 0);

      // check if there are any elements present
      const pageLoad = pageLoads[0];
      assert.isNotNull(pageLoad.elementTiming);
      // we have two <p> elements with element timing and <img>, the length should be higher than 2
      assert.isAbove(pageLoad.elementTiming.length, 2);

      let text1Present = false;
      let text2Present = false;
      let imgPresent = false;

      // check timing element data - each should have the identifier and start time at least
      for (let i = 0; i < 3; i += 1) {
        const timingElem = pageLoad.elementTiming[i];
        assert.isNotNull(timingElem.identifier);
        assert.isTrue(timingElem.identifier === 'test_div_for_element_timing' ||
          timingElem.identifier === 'test_div_for_element_timing_second' ||
          timingElem.identifier === 'test_img_element');
        assert.isAbove(timingElem.startTime, 0);

        // mark presence of a given element
        switch (timingElem.identifier) {
          case 'test_div_for_element_timing': text1Present = true; break;
          case 'test_div_for_element_timing_second': text2Present = true; break;
          case 'test_img_element': imgPresent = true; break;
          default: break;
        }
      }

      assert.isTrue(text1Present);
      assert.isTrue(text2Present);
      assert.isTrue(imgPresent);
    });
  });
  it('Element Timing Present in Soft Page Load', () => {
    // open the e2e.html page
    cy.visit('/e2e.html');

    // start the Cypress server to be able to stub responses
    cy.server();

    // define stubbed route for sampling
    cy.route({
      method: 'HEAD',
      url: '/sampling/*',
      status: 200,
      response: {},
      headers: {
        'X-Sematext-Experience-App-Active': true,
        'X-Sematext-Experience-Sampling-Active': false,
        'X-Sematext-Experience-Sampling-NextEvent': true,
        'X-Sematext-Experience-Sampling-Percentage': 100,
      },
    }).as('head');

    // define stubbed route for sending data
    cy.route({
      method: 'POST',
      url: '/api/v1/apps/8763d12d-1j3t-932v-b498-544290z98k43/data*',
      status: 200,
      response: {
        error: false,
        message: 'accepted event',
      },
    }).as('sendData');

    cy.route({
      method: 'GET',
      url: '/data#*',
      status: 200,
      response: {
        status: 'ok',
      },
    }).as('data');

    // wait for initial data sending
    cy.wait('@sendData').then((xhr) => {
      assert.isNotNull(xhr.request.body);
    });

    // now click the button with route change and long job
    cy.contains('AddTextElement').click();

    // first the ajax call should be present in the data
    cy.wait('@sendData').then((xhr) => {
      assert.isNotNull(xhr.request.body);
      assert.isNotNull(xhr.request.body.body.ajax);
    });

    // next a page load should happen with the element timing data
    cy.wait('@sendData').then((xhr) => {
      assert.isNotNull(xhr.request.body);
      assert.isNotNull(xhr.request.body.body.pageLoad);

      // check if there are page loads present
      const pageLoads = xhr.request.body.body.pageLoad;
      assert.isAbove(pageLoads.length, 0);

      // check if there are any elements present
      const pageLoad = pageLoads[0];
      assert.isNotNull(pageLoad.elementTiming);
      assert.isAbove(pageLoad.elementTiming.length, 0);

      // check timing element data - the identifier should be set
      // to the one of the paragraph element
      const timingElem = pageLoad.elementTiming[0];
      assert.isNotNull(timingElem.identifier);
      assert.isTrue(timingElem.identifier === 'soft_page_load_element_timing');
      assert.isAbove(timingElem.startTime, 0);
    });
  });
  it('Element Timing Present Outside of Hard Page Load', () => {
    // open the e2e.html page
    cy.visit('/e2e.html?slow=1');

    // start the Cypress server to be able to stub responses
    cy.server();

    // define stubbed route for sampling
    cy.route({
      method: 'HEAD',
      url: '/sampling/*',
      status: 200,
      response: {},
      headers: {
        'X-Sematext-Experience-App-Active': true,
        'X-Sematext-Experience-Sampling-Active': false,
        'X-Sematext-Experience-Sampling-NextEvent': true,
        'X-Sematext-Experience-Sampling-Percentage': 100,
      },
    }).as('head');

    // define stubbed route for sending data
    cy.route({
      method: 'POST',
      url: '/api/v1/apps/8763d12d-1j3t-932v-b498-544290z98k43/data*',
      status: 200,
      response: {
        error: false,
        message: 'accepted event',
      },
    }).as('sendData');

    cy.route({
      method: 'GET',
      url: '/data#*',
      status: 200,
      response: {
        status: 'ok',
      },
    }).as('data');

    // next a page load should happen with timing element present
    // we ignore the first send data because it will report ttfb vitals
    cy.wait(['@sendData', '@sendData']).spread((_, xhr) => {
      assert.isNotNull(xhr.request.body);
      assert.isNotNull(xhr.request.body.body.pageLoad);

      // check if there are page loads present
      const pageLoads = xhr.request.body.body.pageLoad;
      assert.isAbove(pageLoads.length, 0);

      // check if there are any elements present
      const pageLoad = pageLoads[0];
      assert.isNotNull(pageLoad.elementTiming);
      // we have two <p> elements with element timing and <img>, the length should be higher than 2
      assert.isAbove(pageLoad.elementTiming.length, 2);

      let text1Present = false;
      let text2Present = false;
      let imgPresent = false;

      // check timing element data - each should have the identifier and start time at least
      for (let i = 0; i < 3; i += 1) {
        const timingElem = pageLoad.elementTiming[i];
        assert.isNotNull(timingElem.identifier);
        assert.isTrue(timingElem.identifier === 'test_div_for_element_timing' ||
          timingElem.identifier === 'test_div_for_element_timing_second' ||
          timingElem.identifier === 'test_img_element');
        assert.isAbove(timingElem.startTime, 0);

        // mark presence of a given element
        switch (timingElem.identifier) {
          case 'test_div_for_element_timing': text1Present = true; break;
          case 'test_div_for_element_timing_second': text2Present = true; break;
          case 'test_img_element': imgPresent = true; break;
          default: break;
        }
      }

      assert.isTrue(text1Present);
      assert.isTrue(text2Present);
      assert.isTrue(imgPresent);
    });

    // We are outside of the hard page load now so we can try generating
    // a new element timing element and it should be fetched by the script.
    // We do that by clicking the button with no route change.
    cy.contains('AddTextElementWithoutRoute').click();

    // next a page load should happen with the element timing data
    cy.wait('@sendData').then((xhr) => {
      assert.isNotNull(xhr.request.body);
      assert.isNotNull(xhr.request.body.body.elementTiming);

      // check if there are element timings
      const elementTimings = xhr.request.body.body.elementTiming;
      assert.isAbove(elementTimings.length, 0);

      // check timing element data - the identifier should be set
      // to the one of the paragraph element
      const timingElem = elementTimings[0];

      assert.isNotNull(timingElem.identifier);
      assert.isTrue(timingElem.identifier === 'element_timing_without_route_change');
      assert.isAbove(timingElem.startTime, 0);
    });
  });
});

/*
 * Copyright (c) Sematext Group, Inc.
 * All Rights Reserved
 *
 * THIS IS UNPUBLISHED PROPRIETARY SOURCE CODE OF Sematext Group, Inc.
 * The copyright notice above does not evidence any
 * actual or intended publication of such source code.
 */

describe('RUM Script Long Tasks Tests', () => {
  it('Long Tasks Present in soft page loads', () => {
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
    cy.contains('SendWithLongJob').click();

    // first the ajax call should be present in the data
    cy.wait('@sendData').then((xhr) => {
      assert.isNotNull(xhr.request.body);
      assert.isNotNull(xhr.request.body.body.ajax);
    });

    // next a page load should happen with long task present
    cy.wait('@sendData').then((xhr) => {
      assert.isNotNull(xhr.request.body);
      assert.isNotNull(xhr.request.body.body.pageLoad);

      // check if there are page loads present
      const pageLoads = xhr.request.body.body.pageLoad;
      assert.isAbove(pageLoads.length, 0);

      // check if there are any long tasks present
      const pageLoad = pageLoads[0];
      assert.isNotNull(pageLoad.longTask);
      assert.isAbove(pageLoad.longTask.length, 0);

      // check long task data
      const longTask = pageLoad.longTask[0];
      assert.isNotNull(longTask.entryType);
      assert.isAbove(longTask.duration, 0);
      assert.isAbove(longTask.startTime, 0);
    });
  });
  it('Long Tasks Present in hard page loads', () => {
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

    // next a page load should happen with long task present
    cy.wait(['@sendData', '@sendData']).spread((_, xhr) => {
      assert.isNotNull(xhr.request.body);
      assert.isNotNull(xhr.request.body.body.pageLoad);

      // check if there are page loads present
      const pageLoads = xhr.request.body.body.pageLoad;
      assert.isAbove(pageLoads.length, 0);

      // check if there are any long tasks present
      const pageLoad = pageLoads[0];
      assert.isNotNull(pageLoad.longTask);
      assert.isAbove(pageLoad.longTask.length, 0);

      // check long task data
      const longTask = pageLoad.longTask[0];
      assert.isNotNull(longTask.entryType);
      assert.isAbove(longTask.duration, 0);
      assert.isAbove(longTask.startTime, 0);
    });
  });
});

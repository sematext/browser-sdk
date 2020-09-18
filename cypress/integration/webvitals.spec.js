/*
 * Copyright (c) Sematext Group, Inc.
 * All Rights Reserved
 *
 * THIS IS UNPUBLISHED PROPRIETARY SOURCE CODE OF Sematext Group, Inc.
 * The copyright notice above does not evidence any
 * actual or intended publication of such source code.
 */

describe('Web Vitals Support', () => {
  it('TTFB is sent', () => {
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

    // ttfb is sent first
    let pageLoadUuid;
    cy.wait('@sendData').then((xhr) => {
      assert.exists(xhr.request.body);
      assert.exists(xhr.request.body.body.vitals);
      assert.isAbove(xhr.request.body.body.vitals.length, 0);
      assert.isNotNull(xhr.request.body.body.vitals[0].pageLoadUuid);
      // eslint-disable-next-line prefer-destructuring
      pageLoadUuid = xhr.request.body.body.vitals[0].pageLoadUuid;
    });

    // page load is sent next
    cy.wait('@sendData').then((xhr) => {
      assert.exists(xhr.request.body);
      assert.exists(xhr.request.body.body.pageLoad);
      assert.isAbove(xhr.request.body.body.pageLoad.length, 0);
      assert.equal(xhr.request.body.body.pageLoad[0].uuid, pageLoadUuid);
    });
  });
});

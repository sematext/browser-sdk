describe('RUM Script Tests', () => {
  it('Sampling Information Requested', () => {
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
    }).as('samplingRequest');

    // check if the sampling call was done
    cy.wait('@samplingRequest').then(() => {
      assert.isTrue(true);
    });
  });
  it('HTTP Call Recorded', () => {
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
    });

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

    // click the button
    cy.contains('Send').click();

    // click it once again
    cy.contains('Send').click();

    // check if the data was send by the RUM script
    cy.wait('@sendData').then((xhr) => {
      assert.isNotNull(xhr.request.body);
      assert.isAbove(xhr.request.body.body.ajax.length, 0);
    });
  });
  it('Hard Page Load Recorded', () => {
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
    });

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

    // check if the data was send by the RUM script
    // we skip one request because it will contain ttfb
    cy.wait(['@sendData', '@sendData']).spread((_, xhr) => {
      assert.isNotNull(xhr.request.body);
      assert.isAbove(xhr.request.body.body.pageLoad.length, 0);
    });
  });
  it('App Disabled', () => {
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
        'X-Sematext-Experience-App-Active': false,
        'X-Sematext-Experience-Sampling-Active': false,
        'X-Sematext-Experience-Sampling-NextEvent': false,
        'X-Sematext-Experience-Sampling-Percentage': 100,
      },
    }).as('samplingRequest');

    // check if the sampling call was done
    cy.wait('@samplingRequest').then(() => {
      assert.isTrue(true);
    });

    // at this point a cookie should be set
    cy.getCookie('8763d12d-1j3t-932v-b498-544290z98k43-app-disabled').should('exist');
  });
});

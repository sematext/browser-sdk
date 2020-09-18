describe('RUM Large Requests Script Tests', () => {
  // because of the large.html and window.SCE_MAX_REQUEST_SIZE set to 10 bytes
  // we expect each of the requests to send data to be sent separately
  it('Multiple Requests Test', () => {
    cy.visit('/large.html');
    cy.server();

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

    cy.wait('@samplingRequest').then(() => {
      assert.isTrue(true);
    });

    cy.route({
      method: 'POST',
      url: '/api/v1/apps/8763d12d-1j3t-932v-b498-544290z98k43/data*',
      status: 200,
      response: {
        error: false,
        message: 'accepted event',
      },
    }).as('sendData');

    // first request will be web vitals
    cy.wait(['@sendData']).then((xhr) => {
      assert.isNotNull(xhr.request.body);
      assert.isAbove(xhr.request.body.body.vitals.length, 0);
    });


    // next request should be page load data
    cy.wait(['@sendData']).then((xhr) => {
      assert.isNotNull(xhr.request.body);
      assert.isAbove(xhr.request.body.body.pageLoad.length, 0);
    });

    // click it once again to fire up Ajax request
    cy.contains('Send').click();

    // before the Ajax request is recorded we have web vitals for that request
    cy.wait(['@sendData']).then((xhr) => {
      assert.isNotNull(xhr.request.body);
      assert.isAbove(xhr.request.body.body.vitals.length, 0);
    });

    // finally the Ajax request should be here
    cy.wait('@sendData').then((xhr) => {
      assert.isNotNull(xhr.request.body);
      assert.isAbove(xhr.request.body.body.ajax.length, 0);
      assert.isBelow(xhr.request.body.body.ajax.length, 2);
    });
  });
});

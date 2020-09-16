describe('Performance Buffer', () => {
  it('Buffer handled properly', () => {
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
    cy.wait('@sendData');

    // establish baseline bufferLength
    cy.window()
      .then(w => cy.wrap(w.performance.getEntries().length).as('bufferLength'));

    cy.contains('SendRouted').click();
    cy.contains('SendRouted').click();
    cy.contains('SendRouted').click();
    cy.contains('SendRouted').click();

    cy.wait(['@data', '@data', '@data', '@data']);

    // establish that new requests were added to performance buffer
    cy.window()
      .then((w) => {
        const currentLength = w.performance.getEntries().length;
        cy.wrap(currentLength).as('maxBuffer');
        cy.get('@bufferLength').should('eq', currentLength - 4);
      });

    cy.wait('@sendData');

    // check if buffer was cleared after data was uploaded we just check that
    // it's less than it was previously to avoid relying on hardcoded numbers
    cy.window()
      .then((w) => {
        const currentLength = w.performance.getEntries().length;
        cy.get('@maxBuffer').should('gt', currentLength);
      });
  });
});

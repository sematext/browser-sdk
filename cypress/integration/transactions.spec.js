describe('On-Page Transactions', () => {
  it('Multiple transactions sent correctly', () => {
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

    // wait for initial page load to be sent
    cy.wait('@sendData');

    // Send first transaction
    let firstTransaction = null;
    cy.contains('SendOnPageTransaction').click();
    cy.wait('@sendData').then((xhr) => {
      assert.isNotNull(xhr.request.body);
      assert.isNotNull(xhr.request.body.body.transaction);

      const transactions = xhr.request.body.body.transaction;
      expect(transactions.length).to.equal(1);
      [firstTransaction] = transactions;
    });

    // Send second transaction
    cy.contains('SendOnPageTransaction').click();
    cy.wait('@sendData').then((xhr) => {
      assert.isNotNull(xhr.request.body);
      assert.isNotNull(xhr.request.body.body.transaction);

      const transactions = xhr.request.body.body.transaction;
      expect(transactions.length).to.equal(1);
      const [secondTransaction] = transactions;

      // First transaction should have happened before the second transaction
      // so both startTime and endTime should be compared.
      expect(new Date(firstTransaction.endTime))
        .to.be.below(new Date(secondTransaction.endTime));
      expect(new Date(firstTransaction.startTime))
        .to.be.below(new Date(secondTransaction.startTime));
    });
  });

  it('Tags can be overriden', () => {
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

    // wait for initial page load to be sent
    cy.wait('@sendData');

    cy.contains('SendOnPageTransaction').click();
    cy.wait('@sendData').then((xhr) => {
      assert.isNotNull(xhr.request.body);
      assert.isNotNull(xhr.request.body.body.transaction);

      const transactions = xhr.request.body.body.transaction;
      expect(transactions.length).to.equal(1);
      expect(transactions[0].meta.user.tags.someTag).to.equal('default');
    });

    // Send second transaction with modified tag
    cy.contains('SendOnPageTransactionWithTagOverriden').click();
    cy.wait('@sendData').then((xhr) => {
      assert.isNotNull(xhr.request.body);
      assert.isNotNull(xhr.request.body.body.transaction);

      const transactions = xhr.request.body.body.transaction;
      expect(transactions.length).to.equal(1);

      // check if the tag was successfully overriden
      expect(transactions[0].meta.user.tags.someTag).to.equal('overriden');

      // check that other tags remained intact
      expect(transactions[0].meta.user.identifier).to.equal('testuser');
      expect(transactions[0].meta.user.name).to.equal('testuser');
    });
  });
});

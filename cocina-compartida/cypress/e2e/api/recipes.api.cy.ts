describe('Recipes API Tests', () => {
  it('should respond to the recipes list endpoint', () => {
    cy.request({
      method: 'GET',
      url: '/api/recipes',
      failOnStatusCode: false,
    }).then((response) => {
      cy.log(`GET /api/recipes responded with: ${response.status}`);
      expect(response.status).to.not.eq(500);
      if (response.status === 200) {
        expect(response.body).to.be.an('array');
      }
    });
  });

  it('should reject recipe creation without authentication', () => {
    cy.request({
      method: 'POST',
      url: '/api/recipes',
      failOnStatusCode: false,
      body: { name: 'Unauthorized Recipe', descripcion: 'Test' }
    }).then((response) => {
      expect(response.status).to.not.eq(200);
      cy.log(`Unauthenticated POST /api/recipes responded with: ${response.status}`);
    });
  });
});

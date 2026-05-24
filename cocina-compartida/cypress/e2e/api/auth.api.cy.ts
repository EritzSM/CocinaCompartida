describe('Auth API Tests', () => {
  it('should respond to login endpoint (rejects invalid credentials)', () => {
    cy.request({
      method: 'POST',
      url: '/api/auth/login',
      failOnStatusCode: false,
      body: {
        email: 'invalid@example.com',
        password: 'wrongpassword'
      }
    }).then((response) => {
      expect(response.status).to.not.eq(200);
      cy.log(`Auth endpoint responded with status: ${response.status}`);
    });
  });

  it('should reject login with empty body via API', () => {
    cy.request({
      method: 'POST',
      url: '/api/auth/login',
      failOnStatusCode: false,
      body: {}
    }).then((response) => {
      expect(response.status).to.not.eq(200);
    });
  });
});

describe('Login Flow', () => {
  it('should display all required elements on the Login page', () => {
    cy.visit('/login');
    cy.get('input[type="email"]').should('be.visible');
    cy.get('input[type="password"]').should('be.visible');
    cy.get('button[type="submit"]').should('be.visible').and('contain', 'Iniciar Sesión');
    cy.get('a[href="/sign-up"]').should('be.visible');
  });

  it('Login page should be accessible', () => {
    cy.visit('/login');
    cy.injectAxe();
    cy.wait(500); 
    cy.checkA11y();
  });

  it('should successfully log in a user and redirect to home', () => {
    cy.intercept('POST', '**/login', {
      statusCode: 200,
      body: { success: true, token: 'mock-jwt-token', user: { id: 1, name: 'Test User' } },
    }).as('loginRequest');

    cy.visit('/login');
    cy.get('input[type="email"]').type('test@example.com');
    cy.get('input[type="password"]').type('Password123!');
    cy.get('button[type="submit"]').click();

    cy.wait('@loginRequest');
    cy.url().should('include', '/home');
  });

  it('should show an error when logging in with invalid credentials', () => {
    cy.intercept('POST', '**/login', {
      statusCode: 401,
      body: { success: false, message: 'Credenciales incorrectas' },
    }).as('badLogin');

    cy.visit('/login');
    cy.get('input[type="email"]').type('hacker@test.com');
    cy.get('input[type="password"]').type('wrongpassword123');
    cy.get('button[type="submit"]').click();

    cy.wait('@badLogin');
    cy.url().should('include', '/login');
    cy.get('.swal2-popup').should('be.visible');
  });
});

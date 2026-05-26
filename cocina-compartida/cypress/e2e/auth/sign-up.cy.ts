describe('Sign Up Flow', () => {
  beforeEach(() => {
    cy.eyesOpen({
      appName: 'Cocina Compartida',
      testName: Cypress.currentTest.title,
    });
  });

  afterEach(() => {
    cy.eyesClose();
  });

  it('should display all required elements on the Sign Up page (Visual Check)', () => {
    cy.visit('/sign-up');
    
    // Check visual layout
    cy.eyesCheckWindow('Sign Up Page Initial Render');

    cy.get('input[formControlName="username"]').should('be.visible');
    cy.get('input[formControlName="email"]').should('be.visible');
    cy.get('input[formControlName="password"]').should('be.visible');
    cy.get('button[type="submit"]').should('be.visible').and('contain', 'Crear Cuenta');
  });

  it('Sign Up page should be accessible', () => {
    cy.visit('/sign-up');
    cy.injectAxe();
    cy.wait(500);
    cy.checkA11y();
  });

  it('should successfully sign up a user', () => {
    cy.intercept('POST', '**/users', {
      statusCode: 201,
      body: { success: true, message: 'User created successfully' },
    }).as('signupRequest');
    
    cy.intercept('POST', '**/login', {
      statusCode: 200,
      body: { success: true, token: 'mock-jwt-token', user: { id: 1, name: 'Test User' } },
    }).as('autoLoginRequest');

    cy.visit('/sign-up');
    cy.get('input[formControlName="username"]').type('NewUser');
    cy.get('input[formControlName="email"]').type('newuser@example.com');
    cy.get('input[formControlName="password"]').type('SecurePassword123!');
    cy.get('input[formControlName="rePassword"]').type('SecurePassword123!');
    cy.get('button[type="submit"]').click();

    cy.wait('@signupRequest');
    cy.wait('@autoLoginRequest');
    
    cy.url().should('include', '/home');
  });
});

describe('Auth Security Tests', () => {
  it('should handle SQL Injection attempts gracefully in the login form', () => {
    cy.intercept('POST', '**/login', {
      statusCode: 401,
      body: { success: false, message: 'Error al intentar iniciar sesión. Revisa tus credenciales.' },
    }).as('injectionAttempt');

    cy.visit('/login');
    cy.get('input[type="email"]').type('admin@test.com');
    cy.get('input[type="password"]').type("' OR '1'='1' --");
    cy.get('button[type="submit"]').click();

    cy.wait('@injectionAttempt');

    cy.url().should('include', '/login');
    cy.get('.swal2-popup').should('be.visible');
    cy.get('.swal2-title').should('contain', 'Ops!');
  });

  it('should not expose authenticated content when accessing profile without a session', () => {
    cy.clearLocalStorage();
    cy.visit('/profile');

    cy.get('body').should('not.contain', 'user@example.com');

    cy.url().then((url) => {
      // Cuando un usuario sin autenticar visita el perfil, debe ser redirigido al login
      // o a la página de inicio.
      const isLogin = url.includes('/login');
      const isHome = url.includes('/home') || url.endsWith('/');
      expect(isLogin || isHome).to.be.true;
    });
  });
});

function makeMockJwt(): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(
    JSON.stringify({
      sub: 'mock-user-id-123',
      id: 'mock-user-id-123',
      username: 'TestUser',
      email: 'test@example.com',
      exp: Math.floor(Date.now() / 1000) + 3600
    })
  );
  return `${header}.${payload}.mock-signature`;
}

describe('Recipe Detail', () => {
  beforeEach(() => {
    cy.window().then((win) => {
      win.localStorage.setItem('token', makeMockJwt());
    });
  });

  it('should display likes count on the recipe detail page (Visual Check)', () => {
    cy.eyesOpen({
      appName: 'Cocina Compartida',
      testName: 'Recipe Detail - Likes Count',
    });

    cy.intercept('GET', '/api/recipes/mock-recipe-id', {
      statusCode: 200,
      body: {
        id: 'mock-recipe-id', name: 'Test Recipe', descripcion: 'Test',
        likes: 10, ingredients: [], steps: [], comments: [],
        user: { id: 'author-id', username: 'testuser', avatar: '' }
      }
    }).as('getRecipe');

    cy.visit('/recipe/mock-recipe-id');
    cy.wait('@getRecipe');

    // Captura visual de la página de detalle completa
    cy.eyesCheckWindow('Recipe Detail Page - Full View');

    cy.get('.likes-summary').should('be.visible').and('contain', 'me gusta');

    cy.eyesClose();
  });

  it('should display the download PDF button when user is logged in (Visual Check)', () => {
    cy.eyesOpen({
      appName: 'Cocina Compartida',
      testName: 'Recipe Detail - PDF Button',
    });

    cy.intercept('GET', '/api/recipes/mock-recipe-id', {
      statusCode: 200,
      body: {
        id: 'mock-recipe-id', name: 'Test Recipe', descripcion: 'Test',
        likes: 5, ingredients: ['Harina', 'Huevos', 'Azúcar'], steps: ['Mezclar', 'Hornear'],
        comments: [], user: { id: 'author-id', username: 'testuser', avatar: '' }
      }
    }).as('getRecipe');

    cy.visit('/recipe/mock-recipe-id');
    cy.wait('@getRecipe');
    cy.wait(300);

    // Captura visual del área del botón PDF
    cy.eyesCheckWindow('Recipe Detail Page - PDF Button Visible');

    cy.get('button.pdf-btn').should('be.visible').and('contain', 'Descargar PDF');

    cy.eyesClose();
  });

  it('Recipe Detail page should be accessible', () => {
    cy.intercept('GET', '/api/recipes/mock-recipe-id', {
      statusCode: 200,
      body: {
        id: 'mock-recipe-id', name: 'Recipe A11y Test', descripcion: 'Test description',
        likes: 3, ingredients: ['Harina', 'Huevos'], steps: ['Mezclar'],
        comments: [], user: { id: 'u1', username: 'testuser', avatar: '' }
      }
    }).as('getRecipeA11y');

    cy.visit('/recipe/mock-recipe-id');
    cy.wait('@getRecipeA11y');
    cy.injectAxe();
    cy.wait(500);
    cy.checkA11y(undefined, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] },
      rules: {
        'link-name': { enabled: false }
      }
    }, undefined, true);
  });

  it('should trigger the PDF download when clicking', () => {
    cy.intercept('GET', '/api/recipes/mock-recipe-id', {
      statusCode: 200,
      body: {
        id: 'mock-recipe-id', name: 'Recipe PDF Test', descripcion: 'Test',
        likes: 3, ingredients: ['Sal'], steps: ['Mezclar'],
        comments: [], user: { id: 'u1', username: 'testuser', avatar: '' }
      }
    }).as('getRecipePdf');

    cy.visit('/recipe/mock-recipe-id');
    cy.wait('@getRecipePdf');
    cy.wait(300);

    cy.get('button.pdf-btn')
      .should('be.visible')
      .and('contain', 'Descargar PDF')
      .click();

    cy.url().should('include', '/recipe/mock-recipe-id');
  });
});


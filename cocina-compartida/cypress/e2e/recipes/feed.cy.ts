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

describe('Recipe Feed & Explore', () => {
  beforeEach(() => {
    cy.window().then((win) => {
      win.localStorage.setItem('token', makeMockJwt());
    });
    cy.eyesOpen({
      appName: 'Cocina Compartida',
      testName: Cypress.currentTest.title,
    });
  });

  afterEach(() => {
    cy.eyesClose();
  });

  it('should display recipe cards correctly on Explore page (Visual Check)', () => {
    cy.intercept('GET', '/api/recipes', {
      statusCode: 200,
      body: [
        { id: 'r1', name: 'Pastel de Chocolate', likes: 15, likedBy: [], user: { id: 'u1', username: 'chef_mario' }, images: [] },
        { id: 'r2', name: 'Tacos de Pollo',      likes: 8,  likedBy: [], user: { id: 'u2', username: 'cocinera_ana' }, images: [] },
        { id: 'r3', name: 'Ensalada César',      likes: 3,  likedBy: [], user: { id: 'u3', username: 'foodlover' }, images: [] },
      ]
    }).as('getRecipes');

    cy.visit('/explore');
    cy.wait('@getRecipes');

    // Captura visual de la página Explore con múltiples tarjetas
    cy.eyesCheckWindow('Explore Page - Recipe Cards Grid');

    cy.get('.like-button').first().should('be.visible');
  });

  it('should show liked state visually after clicking like (Visual Check)', () => {
    const recipeId = 'r1';

    cy.intercept('GET', '/api/recipes', {
      statusCode: 200,
      body: [
        {
          id: recipeId, name: 'Pastel de Chocolate', likes: 5, likedBy: [],
          user: { id: 'author-id', username: 'author', avatar: '' }, images: []
        }
      ]
    }).as('getRecipes');

    cy.intercept('POST', `/api/recipes/${recipeId}/like`, {
      statusCode: 200,
      body: { likes: 6, likedBy: ['mock-user-id-123'] }
    }).as('likeRecipe');

    cy.visit('/explore');
    cy.wait('@getRecipes');

    // Captura antes del like
    cy.eyesCheckWindow('Explore Page - Before Like');

    cy.get('.like-button').first().click();
    cy.wait('@likeRecipe');

    // Captura después del like para verificar el cambio visual del ícono/contador
    cy.eyesCheckWindow('Explore Page - After Like (Counter Updated)');
  });
});


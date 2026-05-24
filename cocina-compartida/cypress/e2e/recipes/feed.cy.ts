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
  });

  it('should display like button on the Explore page', () => {
    cy.intercept('GET', '/api/recipes', {
      statusCode: 200,
      body: [
        { id: 'r1', name: 'Recipe 1', likes: 5, likedBy: [], user: { id: 'u1', username: 'author' }, images: [] }
      ]
    }).as('getRecipes');

    cy.visit('/explore');
    cy.wait('@getRecipes');

    cy.get('.like-button').first().should('be.visible');
  });

  it('should call the like endpoint when clicking the like button', () => {
    const recipeId = 'r1';

    cy.intercept('GET', '/api/recipes', {
      statusCode: 200,
      body: [
        {
          id: recipeId, name: 'Recipe 1', likes: 5, likedBy: [],
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

    cy.get('.like-button').first().click();
    cy.wait('@likeRecipe');
  });
});

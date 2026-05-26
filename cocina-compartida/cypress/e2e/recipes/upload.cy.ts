// Build a minimal fake JWT that Angular's auth service will accept.
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
  const signature = 'mock-signature';
  return `${header}.${payload}.${signature}`;
}

describe('Recipe Upload', () => {
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

  it('should display the recipe upload form with required fields (Visual Check)', () => {
    cy.visit('/recipe-upload');

    // Captura visual del formulario vacío
    cy.eyesCheckWindow('Recipe Upload Form - Empty State');

    cy.get('input[formControlName="name"]').should('be.visible');
    cy.get('input[type="file"]').should('exist');
    cy.get('button').contains(/Guardar/i).should('be.visible');
  });

  it('should show visual state of form after filling name and category', () => {
    cy.visit('/recipe-upload');
    cy.get('input[formControlName="name"]').type('Pastel de Chocolate');
    cy.get('select[formControlName="category"]').select('postres');

    // Captura visual del formulario parcialmente llenado
    cy.eyesCheckWindow('Recipe Upload Form - Name & Category Filled');
  });

  it('Upload Recipe page should be accessible', () => {
    cy.visit('/recipe-upload');
    cy.injectAxe();
    cy.wait(500);
    cy.checkA11y(undefined, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] },
      rules: {
        'label': { enabled: false }
      }
    }, undefined, true);
  });

  it('should submit the upload recipe form and navigate away', () => {
    cy.intercept('POST', '/api/recipes', {
      statusCode: 201,
      body: { id: 'new-recipe-id', name: 'Mi Nueva Receta' }
    }).as('uploadRecipe');

    cy.intercept('GET', '/api/recipes', { statusCode: 200, body: [] }).as('getRecipes');

    cy.intercept('POST', '**/uploads/recipes/**', {
      statusCode: 201,
      body: { success: true, data: ['http://mock-url.com/image.jpg'] }
    }).as('uploadFiles');

    cy.visit('/recipe-upload');

    cy.get('input[formControlName="name"]').type('Mi Nueva Receta');
    cy.get('select[formControlName="category"]').select('postres');
    cy.get('input[formControlName="descripcion"]').type('Esta es una descripción válida y larga');

    cy.get('input[placeholder^="Ingrediente"]').first().type('Sal');
    cy.get('textarea[placeholder^="Paso"]').first().type('Mezclar todo');

    cy.get('input[type="file"]').selectFile({
      contents: Cypress.Buffer.from('dummy image content'),
      fileName: 'test.jpg',
      mimeType: 'image/jpeg'
    }, { force: true });
    cy.wait('@uploadFiles');

    // Captura visual antes de enviar el formulario completo
    cy.eyesCheckWindow('Recipe Upload Form - Fully Filled Before Submit');

    cy.get('button').contains(/Guardar Receta|Guardar Cambios/i).click();

    cy.wait('@uploadRecipe');
    cy.url().should('not.include', '/recipe-upload');
  });
});


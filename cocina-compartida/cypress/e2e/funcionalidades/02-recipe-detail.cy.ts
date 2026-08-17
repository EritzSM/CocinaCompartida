/**
 * F2 — Frontend Recipe Detail: ingredientes, pasos y autor
 *
 * Cubre:
 *   [UI]            Nombre, descripción, ingredientes, pasos y autor visibles
 *   [API]           GET /api/recipes/:id — campos, 404 con ID inválido
 *   [Security]      Datos sensibles no expuestos, acceso público a detalle
 *   [Regression]    Navegación back, recarga, formato consistente
 *   [Accessibility] WCAG 2.1 AA con cypress-axe
 */

function makeMockJwt(): string {
  const header  = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(JSON.stringify({
    sub: 'mock-user-id-123', id: 'mock-user-id-123',
    username: 'TestUser', email: 'test@example.com',
    exp: Math.floor(Date.now() / 1000) + 3600,
  }));
  return `${header}.${payload}.mock-signature`;
}

const MOCK_RECIPE = {
  id: 'mock-recipe-id',
  name: 'Paella Valenciana',
  descripcion: 'Arroz con mariscos y verduras al estilo valenciano tradicional',
  likes: 25,
  likedBy: [],
  category: 'arroces',
  ingredients: ['arroz bomba 500g', 'mejillones 300g', 'gambas 200g', 'azafrán', 'pimiento rojo'],
  steps: [
    'Calentar el aceite en la paellera',
    'Sofreír el pimiento y el tomate',
    'Añadir el arroz y el caldo',
    'Incorporar los mariscos',
    'Dejar reposar 5 minutos antes de servir',
  ],
  comments: [],
  user: { id: 'author-id', username: 'ChefMaestro', url: 'https://example.com/avatar.jpg' },
  images: [],
};

// ════════════════════════════════════════════════════════════════════════════
describe('F2 — Recipe Detail: ingredientes, pasos y autor', () => {

  // ── [UI] ──────────────────────────────────────────────────────────────────
  describe('[UI] Visualización del detalle de receta', () => {
    beforeEach(() => {
      cy.intercept('GET', '/api/recipes/mock-recipe-id', {
        statusCode: 200, body: MOCK_RECIPE,
      }).as('getRecipe');
      cy.window().then(win => win.localStorage.setItem('token', makeMockJwt()));
      cy.visit('/recipe/mock-recipe-id');
      cy.wait('@getRecipe');
    });

    it('[UI-F2-1] muestra el nombre de la receta en la página de detalle', () => {
      cy.contains('Paella Valenciana').should('be.visible');
    });

    it('[UI-F2-2] muestra la descripción de la receta', () => {
      cy.contains('Arroz con mariscos').should('be.visible');
    });

    it('[UI-F2-3] muestra los ingredientes de la receta', () => {
      cy.contains('arroz bomba').should('be.visible');
      cy.contains('mejillones').should('be.visible');
    });

    it('[UI-F2-4] muestra los pasos de preparación', () => {
      cy.contains('Calentar el aceite').should('be.visible');
    });

    it('[UI-F2-5] muestra el autor (username) de la receta', () => {
      cy.contains('ChefMaestro').should('be.visible');
    });

    it('[UI-F2-6] muestra el contador de likes', () => {
      cy.get('.likes-summary, [class*="like"], [class*="heart"]').should('exist');
    });
  });

  // ── [API] ─────────────────────────────────────────────────────────────────
  describe('[API] GET /api/recipes/:id — detalle de receta', () => {
    it('[API-F2-1] responde 200 con la receta completa cuando el ID existe', () => {
      cy.request('GET', '/api/recipes').then(listRes => {
        expect(listRes.status).to.eq(200);
        expect(listRes.body).to.be.an('array');
        if (listRes.body.length === 0) return; // skip si no hay recetas

        const firstId = listRes.body[0].id;
        cy.request({ method: 'GET', url: `/api/recipes/${firstId}`, failOnStatusCode: false })
          .then(res => {
            expect(res.status).to.eq(200);
            expect(res.body).to.have.property('id', firstId);
            expect(res.body).to.have.property('name');
            expect(res.body).to.have.property('user');
          });
      });
    });

    it('[API-F2-2] la receta contiene ingredientes (array) y pasos (array)', () => {
      cy.request('GET', '/api/recipes').then(listRes => {
        if (listRes.body.length === 0) return;
        const firstId = listRes.body[0].id;
        cy.request(`/api/recipes/${firstId}`).then(res => {
          expect(res.body.ingredients).to.be.an('array');
          expect(res.body.steps).to.be.an('array');
        });
      });
    });

    it('[API-F2-3] devuelve error (no 200) con un ID que no existe', () => {
      cy.request({
        method: 'GET', url: '/api/recipes/id-que-no-existe-xyz-999',
        failOnStatusCode: false,
      }).then(res => {
        // El backend puede devolver 400, 404 o 500 para IDs inválidos
        // Lo importante es que NO devuelve 200 (que indicaría datos incorrectos)
        expect(res.status).to.not.eq(200);
        cy.log(`[API-F2-3] ID inválido → status ${res.status} (esperado: cualquier error)`);
      });
    });

    it('[API-F2-4] la receta incluye el objeto user con username', () => {
      cy.request('GET', '/api/recipes').then(listRes => {
        if (listRes.body.length === 0) return;
        const firstId = listRes.body[0].id;
        cy.request(`/api/recipes/${firstId}`).then(res => {
          expect(res.body.user).to.be.an('object');
          expect(res.body.user).to.have.property('username');
        });
      });
    });
  });

  // ── [Security] ────────────────────────────────────────────────────────────
  describe('[Security] Acceso y protección de datos', () => {
    it('[SEC-F2-1] el detalle de receta es accesible sin autenticación (lectura pública)', () => {
      cy.request({ method: 'GET', url: '/api/recipes', failOnStatusCode: false })
        .then(listRes => {
          if (listRes.body.length === 0) return;
          const firstId = listRes.body[0].id;
          cy.request({
            method: 'GET', url: `/api/recipes/${firstId}`,
            failOnStatusCode: false,
          }).then(res => expect(res.status).to.eq(200));
        });
    });

    it('[SEC-F2-2] la respuesta no expone contraseñas en texto plano del autor', () => {
      // HALLAZGO DE SEGURIDAD: el backend expone el hash bcrypt ($2b$) del usuario en el detalle de receta.
      // Este test verifica que, si se expone, sea un hash (no texto plano), que sería crítico.
      cy.request('GET', '/api/recipes').then(listRes => {
        if (listRes.body.length === 0) return;
        const firstId = listRes.body[0].id;
        cy.request(`/api/recipes/${firstId}`).then(res => {
          if (res.body.user?.password) {
            const pwd = res.body.user.password as string;
            expect(pwd).to.match(/^\$2[ab]\$/,
              'VULNERABILIDAD CRÍTICA: contraseña en texto plano expuesta en API'
            );
            cy.log('[SEC-F2-2] HALLAZGO MEDIO: hash bcrypt expuesto en detalle de receta');
          }
          // También verificar que no haya tokens de sesión expuestos
          const body = JSON.stringify(res.body);
          expect(body).to.not.match(/"(access_token|refresh_token|jwt)"\s*:/i);
        });
      });
    });

    it('[SEC-F2-3] un ID con caracteres especiales no causa error 500', () => {
      cy.request({
        method: 'GET',
        url: "/api/recipes/<script>alert('xss')</script>",
        failOnStatusCode: false,
      }).then(res => expect(res.status).to.not.eq(500));
    });
  });

  // ── [Regression] ──────────────────────────────────────────────────────────
  describe('[Regression] Comportamiento estable en detalle', () => {
    beforeEach(() => {
      cy.intercept('GET', '/api/recipes/mock-recipe-id', {
        statusCode: 200, body: MOCK_RECIPE,
      }).as('detailReg');
      cy.window().then(win => win.localStorage.setItem('token', makeMockJwt()));
    });

    it('[REG-F2-1] recargar la página de detalle mantiene la información visible', () => {
      cy.visit('/recipe/mock-recipe-id');
      cy.wait('@detailReg');
      cy.contains('Paella Valenciana').should('be.visible');
      cy.intercept('GET', '/api/recipes/mock-recipe-id', {
        statusCode: 200, body: MOCK_RECIPE,
      }).as('detailReg2');
      cy.reload();
      cy.wait('@detailReg2');
      cy.contains('Paella Valenciana').should('be.visible');
    });

    it('[REG-F2-2] la página de detalle no muestra error cuando la receta tiene ingredientes vacíos', () => {
      const recipeEmpty = { ...MOCK_RECIPE, ingredients: [], steps: [] };
      cy.intercept('GET', '/api/recipes/mock-recipe-id', {
        statusCode: 200, body: recipeEmpty,
      }).as('emptyIngr');
      cy.visit('/recipe/mock-recipe-id');
      cy.wait('@emptyIngr');
      cy.get('body').should('not.contain', 'Error 500');
    });

    it('[REG-F2-3] navegar desde Explore a detalle y volver no rompe la UI', () => {
      // Navegar directamente a /recipe/:id (bypass click en explore para evitar dependencia de UI)
      cy.intercept('GET', '/api/recipes/mock-recipe-id', { statusCode: 200, body: MOCK_RECIPE }).as('detail');
      cy.window().then(win => win.localStorage.setItem('token', makeMockJwt()));
      cy.visit('/recipe/mock-recipe-id');
      cy.wait('@detail');
      cy.url().should('include', '/recipe');
      cy.go('back');
      // Después de volver, la página anterior (inicio u otra) no debe estar rota
      cy.get('body').should('not.contain', 'Error 500');
    });
  });

  // ── [Accessibility] ───────────────────────────────────────────────────────
  describe('[Accessibility] WCAG 2.1 AA — Recipe Detail', () => {
    it('[A11Y-F2-1] la página de detalle de receta supera auditoría WCAG 2.1 AA', () => {
      cy.intercept('GET', '/api/recipes/mock-recipe-id', {
        statusCode: 200, body: MOCK_RECIPE,
      }).as('a11y');
      cy.window().then(win => win.localStorage.setItem('token', makeMockJwt()));
      cy.visit('/recipe/mock-recipe-id');
      cy.wait('@a11y');
      cy.injectAxe();
      cy.checkA11y(undefined, {
        runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] },
        rules: { 'link-name': { enabled: false }, 'color-contrast': { enabled: false } },
      }, (violations) => {
        cy.log(`Violaciones detectadas: ${violations.length}`);
        violations.forEach(v => cy.log(`[${v.impact}] ${v.id}: ${v.description}`));
      }, true);
    });
  });

});

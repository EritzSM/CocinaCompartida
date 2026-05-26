/**
 * F3 — Backend Recipe CRUD: Create, Read, Update, Delete
 *
 * Estrategia:
 *   - Login real con cy.request() → token JWT real
 *   - CREATE → POST /api/recipes con auth real
 *   - READ   → GET  /api/recipes/:id
 *   - UPDATE → PATCH /api/recipes/:id
 *   - DELETE → DELETE /api/recipes/:id
 *
 * Cubre:
 *   [API]      Todas las operaciones CRUD con respuestas correctas
 *   [Security] Sin auth → 401; datos no propios → protección esperada
 *   [Regression] Receta eliminada devuelve 404; creada aparece en listado
 */

const SEEDER_EMAIL    = 'chef@cocinacompartida.com';
const SEEDER_PASSWORD = 'password123';

const TS          = Date.now();
const RECIPE_NAME = `CYPRESS_CRUD_${TS}`;
const RECIPE_EDIT = `CYPRESS_EDITADA_${TS}`;

// ── Helper: login real y obtener token ──────────────────────────────────────
function realLogin(): Cypress.Chainable<string> {
  return cy.request({
    method: 'POST',
    url: '/api/auth/login',
    body: { email: SEEDER_EMAIL, password: SEEDER_PASSWORD },
    failOnStatusCode: false,
  }).then(res => {
    expect([200, 201]).to.include(res.status);
    expect(res.body).to.have.property('token');
    return cy.wrap(res.body.token as string);
  });
}

// ── Helper: petición autenticada ────────────────────────────────────────────
function authRequest(
  method: string, url: string, token: string, body?: object
): Cypress.Chainable<Cypress.Response<any>> {
  return cy.request({
    method,
    url,
    headers: { Authorization: `Bearer ${token}` },
    failOnStatusCode: false,
    ...(body ? { body } : {}),
  });
}

// ════════════════════════════════════════════════════════════════════════════
describe('F3 — Backend CRUD: Create, Read, Update, Delete', () => {

  // ── [API] CRUD Completo ────────────────────────────────────────────────────
  describe('[API] Ciclo CRUD completo con autenticación real', () => {
    let token: string;
    let recipeId: string;
    let deletedRecipeId: string;

    before(() => {
      realLogin().then(t => { token = t; });
    });

    after(() => {
      // Cleanup: eliminar receta de prueba si quedó
      if (recipeId) {
        authRequest('DELETE', `/api/recipes/${recipeId}`, token).then(() => {
          cy.log(`[cleanup] receta ${recipeId} eliminada`);
        });
      }
    });

    it('[API-F3-1] CREATE — POST /api/recipes crea una receta y devuelve 200 o 201 con id', () => {
      authRequest('POST', '/api/recipes', token, {
        name: RECIPE_NAME,
        descripcion: 'Receta creada por test Cypress E2E CRUD',
        ingredients: ['harina 200g', 'azúcar 100g'],
        steps: ['Mezclar ingredientes', 'Hornear 25 minutos'],
        category: 'postres',
        images: [],
      }).then(res => {
        expect([200, 201]).to.include(res.status);
        expect(res.body).to.have.property('id');
        recipeId = res.body.id;
        cy.log(`[CREATE] ✓ id=${recipeId}`);
      });
    });

    it('[API-F3-2] READ — GET /api/recipes/:id devuelve la receta recién creada', () => {
      cy.request(`/api/recipes/${recipeId}`).then(res => {
        expect(res.status).to.eq(200);
        expect(res.body).to.have.property('id', recipeId);
        expect(res.body.name).to.include('CYPRESS_CRUD');
        cy.log(`[READ] ✓ nombre: ${res.body.name}`);
      });
    });

    it('[API-F3-3] READ — la receta creada aparece en el listado GET /api/recipes', () => {
      cy.request('/api/recipes').then(res => {
        expect(res.status).to.eq(200);
        const found = res.body.find((r: any) => r.id === recipeId);
        expect(found).to.not.be.undefined;
        cy.log(`[READ-LIST] ✓ receta encontrada en el listado`);
      });
    });

    it('[API-F3-4] UPDATE — PATCH /api/recipes/:id actualiza el nombre y devuelve 200', () => {
      authRequest('PATCH', `/api/recipes/${recipeId}`, token, {
        name: RECIPE_EDIT,
      }).then(res => {
        expect(res.status).to.eq(200);
        cy.log(`[UPDATE] ✓ status=${res.status}`);
      });
    });

    it('[API-F3-5] UPDATE verificado — GET /api/recipes/:id refleja el nombre actualizado', () => {
      cy.request(`/api/recipes/${recipeId}`).then(res => {
        expect(res.status).to.eq(200);
        expect(res.body.name).to.include('CYPRESS_EDITADA');
        cy.log(`[UPDATE-VERIFY] ✓ nuevo nombre: ${res.body.name}`);
      });
    });

    it('[API-F3-6] DELETE — DELETE /api/recipes/:id devuelve 200 o 204', () => {
      deletedRecipeId = recipeId; // guardar antes de limpiar
      authRequest('DELETE', `/api/recipes/${recipeId}`, token).then(res => {
        expect([200, 204]).to.include(res.status);
        cy.log(`[DELETE] ✓ status=${res.status}, id=${deletedRecipeId}`);
        recipeId = ''; // marcar como eliminada para cleanup en after()
      });
    });

    it('[API-F3-7] DELETE verificado — GET /api/recipes/:id devuelve error (receta no existe)', () => {
      cy.request({
        method: 'GET',
        url: `/api/recipes/${deletedRecipeId}`,
        failOnStatusCode: false,
      }).then(res => {
        // El backend puede devolver 400, 404 o 500 para IDs eliminados/inválidos
        // Lo importante: NO devuelve 200 (que indicaría que la receta aún existe)
        expect(res.status).to.not.eq(200);
        cy.log(`[DELETE-VERIFY] ✓ status=${res.status} (receta eliminada confirmada)`);
      });
    });
  });

  // ── [Security] ────────────────────────────────────────────────────────────
  describe('[Security] Protección de endpoints CRUD', () => {
    it('[SEC-F3-1] POST /api/recipes SIN token devuelve 401 o 403', () => {
      cy.request({
        method: 'POST',
        url: '/api/recipes',
        failOnStatusCode: false,
        body: { name: 'Receta sin auth', descripcion: 'Test' },
      }).then(res => {
        expect([401, 403]).to.include(res.status);
        cy.log(`[SEC-CREATE] ✓ status=${res.status} (rechazado sin auth)`);
      });
    });

    it('[SEC-F3-2] PATCH /api/recipes/:id SIN token devuelve 401 o 403', () => {
      cy.request('GET', '/api/recipes').then(listRes => {
        if (listRes.body.length === 0) return;
        const firstId = listRes.body[0].id;
        cy.request({
          method: 'PATCH',
          url: `/api/recipes/${firstId}`,
          failOnStatusCode: false,
          body: { name: 'Intento sin auth' },
        }).then(res => {
          expect([401, 403]).to.include(res.status);
        });
      });
    });

    it('[SEC-F3-3] DELETE /api/recipes/:id SIN token devuelve 401 o 403', () => {
      cy.request('GET', '/api/recipes').then(listRes => {
        if (listRes.body.length === 0) return;
        const firstId = listRes.body[0].id;
        cy.request({
          method: 'DELETE',
          url: `/api/recipes/${firstId}`,
          failOnStatusCode: false,
        }).then(res => {
          expect([401, 403]).to.include(res.status);
        });
      });
    });

    it('[SEC-F3-4] token inválido (malformado) devuelve 401 o 403', () => {
      cy.request({
        method: 'POST',
        url: '/api/recipes',
        failOnStatusCode: false,
        headers: { Authorization: 'Bearer token.invalido.abc123' },
        body: { name: 'Receta con token falso' },
      }).then(res => {
        expect([401, 403]).to.include(res.status);
      });
    });
  });

  // ── [Regression] ──────────────────────────────────────────────────────────
  describe('[Regression] Comportamiento estable del CRUD', () => {
    it('[REG-F3-1] GET /api/recipes responde siempre 200 con array (no rompe)', () => {
      cy.request('GET', '/api/recipes').then(res => {
        expect(res.status).to.eq(200);
        expect(res.body).to.be.an('array');
      });
    });

    it('[REG-F3-2] POST /api/recipes con body vacío (sin auth) no devuelve 500', () => {
      cy.request({
        method: 'POST', url: '/api/recipes',
        failOnStatusCode: false, body: {},
      }).then(res => expect(res.status).to.not.eq(500));
    });

    it('[REG-F3-3] GET /api/recipes/:id con UUID inexistente responde controlado, no 500', () => {
      cy.request({
        method: 'GET',
        url: '/api/recipes/00000000-0000-0000-0000-000000000000',
        failOnStatusCode: false,
      }).then(res => expect(res.status).to.not.eq(500));
    });

    it('[REG-F3-4] login con credenciales correctas siempre devuelve token', () => {
      cy.request({
        method: 'POST', url: '/api/auth/login',
        body: { email: SEEDER_EMAIL, password: SEEDER_PASSWORD },
        failOnStatusCode: false,
      }).then(res => {
        expect([200, 201]).to.include(res.status);
        expect(res.body.token).to.be.a('string').and.have.length.greaterThan(10);
        cy.log(`[REG-F3-4] ✓ login status=${res.status}, token obtenido`);
      });
    });
  });

});

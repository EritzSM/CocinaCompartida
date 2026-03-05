import { TestBed } from '@angular/core/testing';
import { Router, ActivatedRoute } from '@angular/router';
import { Profile } from '../app/features/pages/profile/profile';
import { Auth } from '../app/shared/services/auth';
import { RecipeService } from '../app/shared/services/recipe';
import { EditProfileService } from '../app/shared/services/edit-profile.service';
import { User } from '../app/shared/interfaces/user';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  VER PERFIL FRONT – Pruebas por camino (assertion, sin mocks)
//  5 caminos + 2 pruebas de fallo
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/* ────────── Datos de prueba ────────── */
const USER: User = {
  id: '1', username: 'testuser', password: '',
  email: 'test@test.com', avatar: 'av.png', bio: 'bio',
};
const OTHER: User = {
  id: '99', username: 'otheruser', password: '',
  email: 'other@test.com', avatar: 'ov.png', bio: 'other bio',
};

/* ────────── Stubs (objetos planos, NO jasmine.createSpyObj) ────────── */
let _nav: any[] | null;

function stubs(
  paramId: string | null,
  opts: {
    cached?: User | null;
    verifyResult?: User | null;
    fetchResult?: User | null | 'unauthorized';
    fetchThrows?: boolean;
  } = {},
) {
  _nav = null;
  let callCount = 0;

  return {
    auth: {
      getCurrentUser: () => {
        callCount++;
        if (opts.cached) return opts.cached;
        if (callCount > 1 && opts.verifyResult) return opts.verifyResult;
        return null;
      },
      verifyLoggedUser: () => Promise.resolve(),
    },
    edit: {
      fetchUserById: (_id: string) => {
        if (opts.fetchThrows) return Promise.reject(new Error('Network Error'));
        return Promise.resolve(opts.fetchResult ?? null);
      },
      uploadAvatar: () => Promise.resolve(undefined),
      updateProfile: () => Promise.resolve(null),
      deleteAccount: () => Promise.resolve(false),
    },
    recipe: { loadRecipes: () => {}, recipes: () => [] },
    router: {
      navigate: (cmds: any[]) => { _nav = cmds; return Promise.resolve(true); },
    },
    route: { snapshot: { paramMap: { get: () => paramId } } },
  };
}

async function build(paramId: string | null, opts: any = {}) {
  const s = stubs(paramId, opts);
  await TestBed.configureTestingModule({
    imports: [Profile],
    providers: [
      { provide: Auth, useValue: s.auth },
      { provide: EditProfileService, useValue: s.edit },
      { provide: RecipeService, useValue: s.recipe },
      { provide: Router, useValue: s.router },
      { provide: ActivatedRoute, useValue: s.route },
    ],
  }).compileComponents();
  return TestBed.createComponent(Profile).componentInstance;
}

const wait = (ms = 0) => new Promise<void>(r => setTimeout(r, ms));

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
describe('Ver Perfil Front – Pruebas por camino', () => {

  beforeEach(() => TestBed.resetTestingModule());
  afterEach(() => {
    // Limpiar popups de Swal que puedan quedar en el DOM
    document.querySelectorAll('.swal2-container').forEach(el => el.remove());
  });

  // ──────────────────────────────────────────────────────────
  //  C1: 1→2→3→4→5→6→8→9→FIN
  //  Sin id en URL, usuario en caché → perfil propio directo
  // ──────────────────────────────────────────────────────────
  describe('C1: Perfil propio (con cache)', () => {

    // Assert: el signal user() contiene exactamente los datos del usuario en cache
    it('C1-T1: user() retorna el usuario logueado desde cache', async () => {
      const comp = await build(null, { cached: USER });
      await comp.ngOnInit();
      await wait();

      expect(comp.user()).toEqual(USER);
    });

    // Assert: isOwnProfile es true cuando no hay id en la URL
    it('C1-T2: isOwnProfile() es true', async () => {
      const comp = await build(null, { cached: USER });
      await comp.ngOnInit();
      await wait();

      expect(comp.isOwnProfile()).toBe(true);
    });

    // Assert: no se ejecuta ninguna redirección
    it('C1-T3: no ocurre redirección', async () => {
      const comp = await build(null, { cached: USER });
      await comp.ngOnInit();
      await wait();

      expect(_nav).toBeNull();
    });
  });

  // ──────────────────────────────────────────────────────────
  //  C2: 1→2→3→4→5→6→7→8→9→FIN
  //  Sin id, sin cache → verifyLoggedUser → perfil propio
  // ──────────────────────────────────────────────────────────
  describe('C2: Perfil propio (sin cache, verificar sesión)', () => {

    // Assert: user() tiene los datos del usuario tras verificar sesión
    it('C2-T1: user() contiene el usuario tras verificar sesión', async () => {
      const comp = await build(null, { verifyResult: USER });
      await comp.ngOnInit();
      await wait();

      expect(comp.user()).toEqual(USER);
    });

    // Assert: isOwnProfile sigue siendo true después de la verificación
    it('C2-T2: isOwnProfile() es true', async () => {
      const comp = await build(null, { verifyResult: USER });
      await comp.ngOnInit();
      await wait();

      expect(comp.isOwnProfile()).toBe(true);
    });
  });

  // ──────────────────────────────────────────────────────────
  //  C3: 1→2→3→4→10→11→12→13→FIN
  //  Con id, respuesta 'unauthorized' → redirige a /home
  // ──────────────────────────────────────────────────────────
  describe('C3: Perfil ajeno (unauthorized)', () => {

    // Assert: user() permanece null porque no se autorizó
    it('C3-T1: user() permanece null', async () => {
      const comp = await build('99', { fetchResult: 'unauthorized' });
      await comp.ngOnInit();
      await wait();

      expect(comp.user()).toBeNull();
    });

    // Assert: redirige exactamente a /home
    it('C3-T2: redirige a /home', async () => {
      const comp = await build('99', { fetchResult: 'unauthorized' });
      await comp.ngOnInit();
      await wait();

      expect(_nav).toEqual(['/home']);
    });

    // Assert: isOwnProfile es false porque era perfil ajeno
    it('C3-T3: isOwnProfile() es false', async () => {
      const comp = await build('99', { fetchResult: 'unauthorized' });
      await comp.ngOnInit();
      await wait();

      expect(comp.isOwnProfile()).toBe(false);
    });
  });

  // ──────────────────────────────────────────────────────────
  //  C4: 1→2→3→4→10→11→12→14→15→16→FIN
  //  Con id, usuario no encontrado → Swal error + redirect
  // ──────────────────────────────────────────────────────────
  describe('C4: Perfil ajeno (usuario no encontrado)', () => {

    // Assert: user() es null porque el backend no encontró al usuario
    it('C4-T1: user() permanece null', async () => {
      const comp = await build('99', { fetchResult: null });
      await comp.ngOnInit();
      await wait();

      expect(comp.user()).toBeNull();
    });

    // Assert: redirige a /home tras mostrar el error
    it('C4-T2: redirige a /home', async () => {
      const comp = await build('99', { fetchResult: null });
      await comp.ngOnInit();
      await wait();

      expect(_nav).toEqual(['/home']);
    });
  });

  // ──────────────────────────────────────────────────────────
  //  C5: 1→2→3→4→10→11→12→14→17→18→19→FIN
  //  Con id, usuario existe → renderizar perfil ajeno
  // ──────────────────────────────────────────────────────────
  describe('C5: Perfil ajeno (usuario existe)', () => {

    // Assert: user() contiene los datos exactos del otro usuario
    it('C5-T1: user() contiene los datos del otro usuario', async () => {
      const comp = await build('99', { fetchResult: OTHER });
      await comp.ngOnInit();
      await wait();

      expect(comp.user()).toEqual(OTHER);
    });

    // Assert: isOwnProfile es false porque estamos viendo un perfil ajeno
    it('C5-T2: isOwnProfile() es false', async () => {
      const comp = await build('99', { fetchResult: OTHER });
      await comp.ngOnInit();
      await wait();

      expect(comp.isOwnProfile()).toBe(false);
    });

    // Assert: la pestaña activa se establece en 'created' al cargar perfil ajeno
    it('C5-T3: activeTab() es "created"', async () => {
      const comp = await build('99', { fetchResult: OTHER });
      await comp.ngOnInit();
      await wait();

      expect(comp.activeTab()).toBe('created');
    });

    // Assert: no se ejecuta ninguna redirección si todo fue exitoso
    it('C5-T4: no ocurre redirección', async () => {
      const comp = await build('99', { fetchResult: OTHER });
      await comp.ngOnInit();
      await wait();

      expect(_nav).toBeNull();
    });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  ⛔ PRUEBAS QUE HACEN FALLAR EL CÓDIGO (bugs reales)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  describe('⛔ Fallos esperados (bugs en el código)', () => {

    // BUG: Cuando fetchUserById lanza una excepción (por ejemplo, error de red),
    // el catch captura el error y muestra Swal, pero NO redirige al usuario.
    // El usuario queda atrapado en una pantalla con perfil vacío.
    it('⛔ F1: tras error de red, debería redirigir a /home pero NO lo hace', async () => {
      const comp = await build('99', { fetchThrows: true });
      await comp.ngOnInit();
      await wait();

      // FALLA: _nav es null porque el catch no llama router.navigate
      expect(_nav).toEqual(['/home']);
    });

    // BUG: isOwnProfile se establece en false ANTES de llamar a fetchUserById.
    // Si el fetch lanza error, isOwnProfile queda en false incorrectamente
    // (el usuario no logró ver ningún perfil ajeno).
    it('⛔ F2: tras error, isOwnProfile debería revertirse a true pero NO lo hace', async () => {
      const comp = await build('99', { fetchThrows: true });
      await comp.ngOnInit();
      await wait();

      // FALLA: isOwnProfile es false porque se setea antes del fetch
      // y nunca se revierte en el catch
      expect(comp.isOwnProfile()).toBe(true);
    });
  });
});

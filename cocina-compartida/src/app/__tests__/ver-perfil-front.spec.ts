import { TestBed } from '@angular/core/testing';
import { Router, ActivatedRoute } from '@angular/router';
import { Profile } from '../features/pages/profile/profile';
import { Auth } from '../shared/services/auth';
import { RecipeService } from '../shared/services/recipe';
import { EditProfileService } from '../shared/services/edit-profile.service';
import { User } from '../shared/interfaces/user';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  VER PERFIL FRONT – AAA / FIRST / 5 tipos de Test Double
//
//  Tipos de mocks usados:
//    [DUMMY]  → RecipeService (DI requerido; las recetas no son parte del CUT)
//               edit.uploadAvatar, updateProfile, deleteAccount (no ejercitados en ngOnInit)
//    [STUB]   → Auth.getCurrentUser / verifyLoggedUser (respuesta fija por camino),
//               ActivatedRoute (paramId controlado), edit.fetchUserById (resultado por caso)
//    [SPY]    → Router.navigate (jasmine.createSpy; observa si ocurrió navegación)
//    [MOCK]   → Router.navigate en C3/C4 (llamada con '/home' es la expectativa central)
//    [FAKE]   → Auth.getCurrentUser en C2 (contador interno simula evolución del estado
//               de sesión entre llamadas consecutivas)
//
//  Principios FIRST:
//    Fast:        build() con stubs planos; sin I/O real ni HttpClient
//    Independent: navigateSpy es local a cada build(); beforeEach resetea TestBed
//    Repeatable:  Datos y comportamientos deterministas; sin side effects entre tests
//    Self-val:    Cada test verifica exactamente un aspecto (user(), isOwnProfile() o navigate)
//    Timely:      5 caminos cubriendo todas las ramas del ngOnInit del componente Profile
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const USER: User  = { id: '1',  username: 'testuser',  password: '', email: 'test@test.com',  avatar: 'av.png', bio: 'bio' };
const OTHER: User = { id: '99', username: 'otheruser', password: '', email: 'other@test.com', avatar: 'ov.png', bio: 'other bio' };

const wait = (ms = 0) => new Promise<void>(r => setTimeout(r, ms));

async function build(
  paramId: string | null,
  opts: {
    cached?:       User | null;
    verifyResult?: User | null;
    fetchResult?:  User | null | 'unauthorized';
    fetchThrows?:  boolean;
  } = {},
) {
  // [SPY] – registra llamadas a navigate() para verificar redirecciones en el Assert
  const navigateSpy = jasmine.createSpy('navigate').and.returnValue(Promise.resolve(true));

  // Contador interno del [FAKE] de Auth (ver abajo)
  let callCount = 0;

  await TestBed.configureTestingModule({
    imports: [Profile],
    providers: [
      {
        provide: Auth,
        useValue: {
          // [STUB] cuando opts.cached está definido (C1): devuelve el usuario directo.
          // [FAKE] cuando opts.verifyResult está definido (C2): simula que la primera
          //        llamada a getCurrentUser() devuelve null y la segunda (tras verify)
          //        devuelve el usuario; el contador interno reproduce la evolución real
          //        del estado de sesión sin necesidad de Angular signals ni RxJS.
          getCurrentUser: () => {
            callCount++;
            if (opts.cached) return opts.cached;
            if (callCount > 1 && opts.verifyResult) return opts.verifyResult;
            return null;
          },
          verifyLoggedUser: () => Promise.resolve(),
        },
      },
      {
        provide: EditProfileService,
        useValue: {
          // [STUB] – controla el resultado de la búsqueda de perfil ajeno por camino
          fetchUserById: (_id: string) => {
            if (opts.fetchThrows) return Promise.reject(new Error('Network Error'));
            return Promise.resolve(opts.fetchResult ?? null);
          },
          // [DUMMY] – requeridos por DI; no se ejercitan en el camino de carga del perfil
          uploadAvatar:  () => Promise.resolve(undefined),
          updateProfile: () => Promise.resolve(null),
          deleteAccount: () => Promise.resolve(false),
        },
      },
      // [DUMMY] – requerido por DI; la carga de recetas ocurre pero no es el CUT aquí
      { provide: RecipeService,  useValue: { loadRecipes: () => {}, recipes: () => [] } },
      // [SPY] / [MOCK] – navigate registrado para verificar en qué dirección redirige
      { provide: Router,         useValue: { navigate: navigateSpy } },
      // [STUB] – paramMap.get devuelve el id controlado por el test
      { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => paramId } } } },
    ],
  }).compileComponents();

  const comp = TestBed.createComponent(Profile).componentInstance;
  return { comp, navigateSpy };
}

describe('Ver Perfil Front – AAA / FIRST / 5 Test Doubles', () => {

  beforeEach(() => TestBed.resetTestingModule());
  afterEach(() => document.querySelectorAll('.swal2-container').forEach(el => el.remove()));

  // ──────────────────────────────────────────────────────────
  //  C1: 1→2→3→4→5→6→8→9→FIN
  //  Sin id en URL, usuario en caché → perfil propio directo
  // ──────────────────────────────────────────────────────────
  describe('C1: Perfil propio (con caché)', () => {

    it('C1-T1: user() retorna el usuario logueado desde caché', async () => {
      // Arrange
      const { comp } = await build(null, { cached: USER });

      // Act
      await comp.ngOnInit();
      await wait();

      // Assert
      expect(comp.user()).toEqual(USER);
    });

    it('C1-T2: isOwnProfile() es true', async () => {
      // Arrange
      const { comp } = await build(null, { cached: USER });

      // Act
      await comp.ngOnInit();
      await wait();

      // Assert
      expect(comp.isOwnProfile()).toBe(true);
    });

    it('C1-T3: no ocurre ninguna redirección', async () => {
      // Arrange
      const { comp, navigateSpy } = await build(null, { cached: USER });

      // Act
      await comp.ngOnInit();
      await wait();

      // Assert
      expect(navigateSpy).not.toHaveBeenCalled();
    });
  });

  // ──────────────────────────────────────────────────────────
  //  C2: 1→2→3→4→5→6→7→8→9→FIN
  //  Sin id, sin caché → verifyLoggedUser → perfil propio
  // ──────────────────────────────────────────────────────────
  describe('C2: Perfil propio (sin caché, verifica sesión)', () => {

    it('C2-T1: user() contiene el usuario tras verificar sesión', async () => {
      // Arrange
      const { comp } = await build(null, { verifyResult: USER });

      // Act
      await comp.ngOnInit();
      await wait();

      // Assert
      expect(comp.user()).toEqual(USER);
    });

    it('C2-T2: isOwnProfile() es true tras verificar sesión', async () => {
      // Arrange
      const { comp } = await build(null, { verifyResult: USER });

      // Act
      await comp.ngOnInit();
      await wait();

      // Assert
      expect(comp.isOwnProfile()).toBe(true);
    });
  });

  // ──────────────────────────────────────────────────────────
  //  C3: 1→2→3→4→10→11→12→13→FIN
  //  Con id, respuesta 'unauthorized' → redirige a /home
  // ──────────────────────────────────────────────────────────
  describe('C3: Perfil ajeno (unauthorized)', () => {

    it('C3-T1: user() permanece null al recibir unauthorized', async () => {
      // Arrange
      const { comp } = await build('99', { fetchResult: 'unauthorized' });

      // Act
      await comp.ngOnInit();
      await wait();

      // Assert
      expect(comp.user()).toBeNull();
    });

    it('C3-T2: redirige exactamente a /home', async () => {
      // Arrange
      // [MOCK] – la llamada a navigate con ['/home'] es la expectativa contractual;
      //          se declara la intención de verificarla antes del Act
      const { comp, navigateSpy } = await build('99', { fetchResult: 'unauthorized' });

      // Act
      await comp.ngOnInit();
      await wait();

      // Assert
      expect(navigateSpy).toHaveBeenCalledWith(['/home']);
    });

    it('C3-T3: isOwnProfile() es false (era perfil ajeno)', async () => {
      // Arrange
      const { comp } = await build('99', { fetchResult: 'unauthorized' });

      // Act
      await comp.ngOnInit();
      await wait();

      // Assert
      expect(comp.isOwnProfile()).toBe(false);
    });
  });

  // ──────────────────────────────────────────────────────────
  //  C4: 1→2→3→4→10→11→12→14→15→16→FIN
  //  Con id, usuario no encontrado → Swal error + redirect
  // ──────────────────────────────────────────────────────────
  describe('C4: Perfil ajeno (usuario no encontrado)', () => {

    it('C4-T1: user() permanece null si el backend no encontró al usuario', async () => {
      // Arrange
      const { comp } = await build('99', { fetchResult: null });

      // Act
      await comp.ngOnInit();
      await wait();

      // Assert
      expect(comp.user()).toBeNull();
    });

    it('C4-T2: redirige a /home tras mostrar el Swal de error', async () => {
      // Arrange
      // [MOCK] – expectativa de redirección a '/home' definida antes del Act
      const { comp, navigateSpy } = await build('99', { fetchResult: null });

      // Act
      await comp.ngOnInit();
      await wait();

      // Assert
      expect(navigateSpy).toHaveBeenCalledWith(['/home']);
    });
  });

  // ──────────────────────────────────────────────────────────
  //  C5: 1→2→3→4→10→11→12→14→17→18→19→FIN
  //  Con id, usuario existe → renderizar perfil ajeno
  // ──────────────────────────────────────────────────────────
  describe('C5: Perfil ajeno (usuario existe)', () => {

    it('C5-T1: user() contiene los datos del otro usuario', async () => {
      // Arrange
      const { comp } = await build('99', { fetchResult: OTHER });

      // Act
      await comp.ngOnInit();
      await wait();

      // Assert
      expect(comp.user()).toEqual(OTHER);
    });

    it('C5-T2: isOwnProfile() es false (estamos viendo un perfil ajeno)', async () => {
      // Arrange
      const { comp } = await build('99', { fetchResult: OTHER });

      // Act
      await comp.ngOnInit();
      await wait();

      // Assert
      expect(comp.isOwnProfile()).toBe(false);
    });

    it('C5-T3: activeTab() es "created" al cargar un perfil ajeno', async () => {
      // Arrange
      const { comp } = await build('99', { fetchResult: OTHER });

      // Act
      await comp.ngOnInit();
      await wait();

      // Assert
      expect(comp.activeTab()).toBe('created');
    });

    it('C5-T4: no ocurre redirección si la carga fue exitosa', async () => {
      // Arrange
      const { comp, navigateSpy } = await build('99', { fetchResult: OTHER });

      // Act
      await comp.ngOnInit();
      await wait();

      // Assert
      expect(navigateSpy).not.toHaveBeenCalled();
    });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  ⛔ PRUEBAS QUE HACEN FALLAR EL CÓDIGO (bugs reales)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  describe('⛔ Fallos esperados (bugs en el código)', () => {

    it('⛔ F1: tras error de red debería redirigir a /home pero NO lo hace', async () => {
      // Arrange
      const { comp, navigateSpy } = await build('99', { fetchThrows: true });

      // Act
      await comp.ngOnInit();
      await wait();

      // Assert – FALLA: el catch del componente no llama a router.navigate
      expect(navigateSpy).toHaveBeenCalledWith(['/home']);
    });

    it('⛔ F2: tras error, isOwnProfile debería revertirse a true pero NO lo hace', async () => {
      // Arrange
      const { comp } = await build('99', { fetchThrows: true });

      // Act
      await comp.ngOnInit();
      await wait();

      // Assert – FALLA: isOwnProfile se setea false antes del fetch y no se revierte en el catch
      expect(comp.isOwnProfile()).toBe(true);
    });
  });
});

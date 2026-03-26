import { TestBed } from '@angular/core/testing';
import { Router, ActivatedRoute } from '@angular/router';
import { Profile } from '../features/pages/profile/profile';
import { Auth } from '../shared/services/auth';
import { RecipeService } from '../shared/services/recipe';
import { EditProfileService } from '../shared/services/edit-profile.service';
import { User } from '../shared/interfaces/user';

/**
 * EDITAR PERFIL FRONT – Triple-A / FIRST / 5 tipos de mock
 * ─────────────────────────────────────────────────────────────────────────
 * Tipos de mock utilizados:
 *   DUMMY  → RecipeService y Router (C1–C3): requeridos por el DI del
 *             componente pero nunca invocados en este grupo de tests.
 *   STUB   → Auth, fetchUserById, uploadAvatar, deleteAccount, route:
 *             devuelven respuestas fijas y conocidas de antemano.
 *   SPY    → EditProfileService.updateProfile en C1–C3: jasmine.createSpy
 *             registra llamadas y argumentos para verificarlos en Assert.
 *   MOCK   → updateProfile en ⛔F3: spy pre-programado con retardo 50 ms;
 *             la expectativa de "una sola llamada" es la especificación
 *             del comportamiento correcto del guard.
 *   FAKE   → ActivatedRoute: implementación simplificada pero operativa
 *             que simula paramMap.get(key) con lógica real de búsqueda.
 *
 * Principios FIRST:
 *   Fast        – Sin peticiones HTTP reales; spies síncronos donde es posible.
 *   Independent – Cada test construye sus propios dobles; se eliminaron las
 *                 variables mutables compartidas _updateCalled/_updatePayload.
 *   Repeatable  – Datos 100 % hardcoded; sin fechas ni aleatoriedad.
 *   Self-val.   – Cada test tiene al menos un expect() con resultado booleano.
 *   Timely      – Tests escritos junto al desarrollo de la funcionalidad.
 */

// ── Datos de prueba ────────────────────────────────────────────────────────
const USER: User = {
  id: '1', username: 'testuser', password: '',
  email: 'test@test.com', avatar: 'av.png', bio: 'mi bio',
};
const UPDATED: User = {
  id: '1', username: 'nuevoNombre', password: '',
  email: 'test@test.com', avatar: 'av.png', bio: 'nueva bio',
};

// ── Helper: monta el módulo y devuelve el componente + spy ─────────────────
async function buildComponent(updateResult: User | null) {

  // [SPY] – registra llamadas y argumentos para verificación en la fase Assert
  const updateProfileSpy = jasmine.createSpy('updateProfile')
    .and.returnValue(Promise.resolve(updateResult));

  // [STUB] – respuesta fija para la sesión activa
  const authStub = {
    getCurrentUser:   () => USER,
    verifyLoggedUser: () => Promise.resolve(),
  };

  // Servicio edit: [STUB]s para métodos irrelevantes + [SPY] sobre updateProfile
  const editService = {
    fetchUserById: () => Promise.resolve(null),         // [STUB]
    uploadAvatar:  () => Promise.resolve(undefined),    // [STUB]
    updateProfile: updateProfileSpy,                    // [SPY]
    deleteAccount: () => Promise.resolve(false),        // [STUB]
  };

  // [DUMMY] – requeridos por DI del componente pero nunca invocados aquí
  const recipeDummy = { loadRecipes: () => {}, recipes: () => [] };
  const routerDummy = { navigate: () => Promise.resolve(true) };

  // [FAKE] – implementación simplificada con lógica real de búsqueda por clave
  const routeFake = {
    snapshot: {
      paramMap: {
        _params: {} as Record<string, string>,
        get(key: string): string | null { return (this._params as any)[key] ?? null; },
      },
    },
  };

  await TestBed.configureTestingModule({
    imports: [Profile],
    providers: [
      { provide: Auth,               useValue: authStub    },
      { provide: EditProfileService, useValue: editService  },
      { provide: RecipeService,      useValue: recipeDummy  },
      { provide: Router,             useValue: routerDummy  },
      { provide: ActivatedRoute,     useValue: routeFake    },
    ],
  }).compileComponents();

  const comp = TestBed.createComponent(Profile).componentInstance;
  await comp.ngOnInit();
  await new Promise<void>(r => setTimeout(r, 0));

  return { comp, updateProfileSpy };
}

// ── Suite ──────────────────────────────────────────────────────────────────
describe('Editar Perfil Front – AAA / FIRST / Mocks', () => {

  beforeEach(() => TestBed.resetTestingModule());
  afterEach(() => {
    document.querySelectorAll('.swal2-container').forEach(el => el.remove());
  });

  // ── C1: Username válido + update exitoso ─────────────────────────────────
  describe('C1: Username válido + update exitoso', () => {

    it('C1-T1: user() se actualiza con los datos devueltos por el servidor', async () => {
      // Arrange
      const { comp } = await buildComponent(UPDATED);
      comp.newUsername = 'nuevoNombre';
      comp.newBio      = 'nueva bio';

      // Act
      await comp.saveProfileUpdates();

      // Assert
      expect(comp.user()).toEqual(UPDATED);
    });

    it('C1-T2: el modal se cierra tras un update exitoso', async () => {
      // Arrange
      const { comp } = await buildComponent(UPDATED);
      comp.modalVisible = true;
      comp.newUsername  = 'nuevoNombre';

      // Act
      await comp.saveProfileUpdates();

      // Assert
      expect(comp.modalVisible).toBe(false);
    });

    it('C1-T3: isUpdating vuelve a false tras completar', async () => {
      // Arrange
      const { comp } = await buildComponent(UPDATED);
      comp.newUsername = 'nuevoNombre';

      // Act
      await comp.saveProfileUpdates();

      // Assert
      expect(comp.isUpdating).toBe(false);
    });

    it('C1-T4: updateProfile recibe el username y la bio correctos [Spy]', async () => {
      // Arrange
      const { comp, updateProfileSpy } = await buildComponent(UPDATED);
      comp.newUsername = 'nuevoNombre';
      comp.newBio      = 'nueva bio';
      comp.newAvatar   = 'av.png';

      // Act
      await comp.saveProfileUpdates();

      // Assert – el [SPY] expone los argumentos registrados en la llamada
      expect(updateProfileSpy).toHaveBeenCalled();
      const payload = updateProfileSpy.calls.mostRecent().args[0];
      expect(payload.username).toBe('nuevoNombre');
      expect(payload.bio).toBe('nueva bio');
    });
  });

  // ── C2: Username vacío ───────────────────────────────────────────────────
  describe('C2: Username vacío', () => {

    it('C2-T1: no se llama updateProfile si username está vacío [Spy]', async () => {
      // Arrange
      const { comp, updateProfileSpy } = await buildComponent(UPDATED);
      comp.newUsername = '';

      // Act
      await comp.saveProfileUpdates();

      // Assert – el [SPY] confirma que NO fue invocado
      expect(updateProfileSpy).not.toHaveBeenCalled();
    });

    it('C2-T2: no se llama updateProfile si username son solo espacios [Spy]', async () => {
      // Arrange
      const { comp, updateProfileSpy } = await buildComponent(UPDATED);
      comp.newUsername = '   ';

      // Act
      await comp.saveProfileUpdates();

      // Assert
      expect(updateProfileSpy).not.toHaveBeenCalled();
    });

    it('C2-T3: isUpdating permanece en false (nunca se activó)', async () => {
      // Arrange
      const { comp } = await buildComponent(UPDATED);
      comp.newUsername = '';

      // Act
      await comp.saveProfileUpdates();

      // Assert
      expect(comp.isUpdating).toBe(false);
    });
  });

  // ── C3: Username válido + update falla ───────────────────────────────────
  describe('C3: Username válido + update falla', () => {

    it('C3-T1: user() NO se modifica cuando el servidor retorna null', async () => {
      // Arrange
      const { comp } = await buildComponent(null);
      comp.newUsername = 'intentoFallido';

      // Act
      await comp.saveProfileUpdates();

      // Assert – el signal sigue con los datos originales
      expect(comp.user()).toEqual(USER);
    });

    it('C3-T2: el modal permanece abierto tras el fallo', async () => {
      // Arrange
      const { comp } = await buildComponent(null);
      comp.modalVisible = true;
      comp.newUsername  = 'intentoFallido';

      // Act
      await comp.saveProfileUpdates();

      // Assert
      expect(comp.modalVisible).toBe(true);
    });

    it('C3-T3: isUpdating vuelve a false tras el fallo', async () => {
      // Arrange
      const { comp } = await buildComponent(null);
      comp.newUsername = 'intentoFallido';

      // Act
      await comp.saveProfileUpdates();

      // Assert
      expect(comp.isUpdating).toBe(false);
    });
  });

  // ── ⛔ Bugs documentados ─────────────────────────────────────────────────
  describe('⛔ Fallos esperados (bugs en el código)', () => {

    it('⛔ F1: password con solo espacios NO debería incluirse en el payload [Spy]', async () => {
      // Arrange
      const { comp, updateProfileSpy } = await buildComponent(UPDATED);
      comp.newUsername = 'test';
      comp.newPassword = '   ';

      // Act
      await comp.saveProfileUpdates();

      // Assert – FALLA: '   ' es truthy y se incluye en el payload
      const payload = updateProfileSpy.calls.mostRecent().args[0];
      expect(payload.password).toBeUndefined();
    });

    it('⛔ F2: username de 1 carácter NO debería pasar la validación [Spy]', async () => {
      // Arrange
      const { comp, updateProfileSpy } = await buildComponent(UPDATED);
      comp.newUsername = 'a';

      // Act
      await comp.saveProfileUpdates();

      // Assert – FALLA: 'a'.trim() no es vacío, updateProfile sí es llamado
      expect(updateProfileSpy).not.toHaveBeenCalled();
    });

    it('⛔ F3: doble llamada rápida NO debería enviar 2 requests [Mock]', async () => {
      // Arrange
      // [MOCK] – spy pre-programado con retardo de 50 ms; la restricción de
      // "exactamente 1 llamada" es parte de la especificación del guard
      const slowMock = jasmine.createSpy('updateProfile').and.callFake(
        () => new Promise<User>(r => setTimeout(() => r(UPDATED), 50))
      );

      const authStub    = { getCurrentUser: () => USER, verifyLoggedUser: () => Promise.resolve() }; // [STUB]
      const editMock    = {
        fetchUserById: () => Promise.resolve(null),          // [STUB]
        uploadAvatar:  () => Promise.resolve(undefined),     // [STUB]
        updateProfile: slowMock,                             // [MOCK]
        deleteAccount: () => Promise.resolve(false),         // [STUB]
      };
      const recipeDummy = { loadRecipes: () => {}, recipes: () => [] }; // [DUMMY]
      const routerDummy = { navigate: () => Promise.resolve(true) };    // [DUMMY]
      const routeFake   = { snapshot: { paramMap: { get: () => null } } }; // [FAKE]

      await TestBed.configureTestingModule({
        imports: [Profile],
        providers: [
          { provide: Auth,               useValue: authStub    },
          { provide: EditProfileService, useValue: editMock    },
          { provide: RecipeService,      useValue: recipeDummy },
          { provide: Router,             useValue: routerDummy },
          { provide: ActivatedRoute,     useValue: routeFake   },
        ],
      }).compileComponents();

      const comp = TestBed.createComponent(Profile).componentInstance;
      await comp.ngOnInit();
      await new Promise<void>(r => setTimeout(r, 0));
      comp.newUsername = 'test';

      // Act – simula doble click concurrente sin esperar el primero
      comp.saveProfileUpdates();
      comp.saveProfileUpdates();
      await new Promise<void>(r => setTimeout(r, 200));

      // Assert – FALLA: isUpdating no actúa como guard y se envían 2 requests
      expect(slowMock).toHaveBeenCalledTimes(1);
    });
  });
});

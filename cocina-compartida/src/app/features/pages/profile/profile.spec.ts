import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router, ActivatedRoute } from '@angular/router';
import { Profile } from './profile';
import { Auth } from '../../../shared/services/auth';
import { RecipeService } from '../../../shared/services/recipe';
import { EditProfileService } from '../../../shared/services/edit-profile.service';
import { User } from '../../../shared/interfaces/user';
import Swal from 'sweetalert2';

// ─── Mocks ───────────────────────────────────────────────
const MOCK_USER: User = {
  id: '1',
  username: 'testuser',
  password: '',
  email: 'test@test.com',
  avatar: 'avatar.png',
  bio: 'bio',
};

const MOCK_OTHER_USER: User = {
  id: '99',
  username: 'otheruser',
  password: '',
  email: 'other@test.com',
  avatar: 'other-avatar.png',
  bio: 'other bio',
};

function buildMocks(paramId: string | null = null) {
  const authMock = jasmine.createSpyObj('Auth', [
    'getCurrentUser',
    'verifyLoggedUser',
  ]);
  authMock.getCurrentUser.and.returnValue(null);
  authMock.verifyLoggedUser.and.returnValue(Promise.resolve());

  const editMock = jasmine.createSpyObj('EditProfileService', [
    'fetchUserById',
    'uploadAvatar',
    'updateProfile',
    'deleteAccount',
  ]);
  editMock.fetchUserById.and.returnValue(Promise.resolve(null));

  const recipeMock = jasmine.createSpyObj('RecipeService', ['loadRecipes'], {
    recipes: () => [],
  });

  const routerMock = jasmine.createSpyObj('Router', ['navigate']);
  routerMock.navigate.and.returnValue(Promise.resolve(true));

  const routeStub = {
    snapshot: { paramMap: { get: (_key: string) => paramId } },
  };

  return { authMock, editMock, recipeMock, routerMock, routeStub };
}

async function createComponent(paramId: string | null = null) {
  const mocks = buildMocks(paramId);

  await TestBed.configureTestingModule({
    imports: [Profile],
    providers: [
      { provide: Auth, useValue: mocks.authMock },
      { provide: EditProfileService, useValue: mocks.editMock },
      { provide: RecipeService, useValue: mocks.recipeMock },
      { provide: Router, useValue: mocks.routerMock },
      { provide: ActivatedRoute, useValue: mocks.routeStub },
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(Profile);
  return { fixture, component: fixture.componentInstance, ...mocks };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  VER PERFIL FRONT – 46 pruebas unitarias (2 × 23 aristas)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

describe('Profile – Ver Perfil Front (grafo de flujo)', () => {

  beforeEach(() => TestBed.resetTestingModule());

  // ── Arista 1→2: Usuario entra → ngOnInit() ──
  describe('Arista 1→2 (Inicio → ngOnInit)', () => {
    // Verifica que al crear el componente, ngOnInit() se ejecuta correctamente.
    it('A1-T1: ngOnInit se ejecuta al crear el componente', async () => {
      const { component } = await createComponent();
      spyOn(component, 'ngOnInit').and.callThrough();
      component.ngOnInit();
      expect(component.ngOnInit).toHaveBeenCalled();
    });

    // Verifica que el componente Profile implementa el método ngOnInit (ciclo de vida Angular).
    it('A1-T2: ngOnInit existe como método del componente', async () => {
      const { component } = await createComponent();
      expect(component.ngOnInit).toBeDefined();
    });
  });

  // ── Arista 2→3: ngOnInit → loadUserProfile() ──
  describe('Arista 2→3 (ngOnInit → loadUserProfile)', () => {
    // Verifica que ngOnInit delega la carga del perfil llamando al método privado loadUserProfile.
    it('A2-T1: ngOnInit invoca loadUserProfile internamente', async () => {
      const { component } = await createComponent();
      const spy = spyOn<any>(component, 'loadUserProfile').and.returnValue(Promise.resolve());
      component.ngOnInit();
      expect(spy).toHaveBeenCalled();
    });

    // Verifica que loadUserProfile se llama solo una vez por cada inicialización del componente.
    it('A2-T2: ngOnInit invoca loadUserProfile exactamente una vez', async () => {
      const { component } = await createComponent();
      const spy = spyOn<any>(component, 'loadUserProfile').and.returnValue(Promise.resolve());
      component.ngOnInit();
      expect(spy).toHaveBeenCalledTimes(1);
    });
  });

  // ── Arista 3→4: loadUserProfile → ¿URL trae id? ──
  describe('Arista 3→4 (loadUserProfile → verifica id en URL)', () => {
    // Cuando la URL NO trae id, el sistema detecta que es perfil propio → isOwnProfile = true.
    it('A3-T1: lee el parámetro id de la ruta (sin id)', async () => {
      const { component } = await createComponent(null);
      await component.ngOnInit();
      await fixture();
      expect(component.isOwnProfile()).toBeTrue();
    });

    // Cuando la URL SÍ trae id, el sistema detecta que es perfil ajeno → isOwnProfile = false.
    it('A3-T2: lee el parámetro id de la ruta (con id)', async () => {
      const { component, editMock } = await createComponent('99');
      editMock.fetchUserById.and.returnValue(Promise.resolve(MOCK_OTHER_USER));
      await component.ngOnInit();
      await wait();
      expect(component.isOwnProfile()).toBeFalse();
    });
  });

  // ── Arista 4→5 (No): No trae id → isOwnProfile = true ──
  describe('Arista 4→5 (No hay id → isOwnProfile = true)', () => {
    // Sin id en la URL, el signal isOwnProfile se marca como true (perfil propio).
    it('A4-T1: sin id en URL, isOwnProfile se establece en true', async () => {
      const { component, authMock } = await createComponent(null);
      authMock.getCurrentUser.and.returnValue(MOCK_USER);
      await component.ngOnInit();
      await wait();
      expect(component.isOwnProfile()).toBeTrue();
    });

    // Sin id en la URL, no se debe llamar a fetchUserById ya que no hay perfil ajeno que buscar.
    it('A4-T2: sin id en URL, nunca se llama fetchUserById', async () => {
      const { component, authMock, editMock } = await createComponent(null);
      authMock.getCurrentUser.and.returnValue(MOCK_USER);
      await component.ngOnInit();
      await wait();
      expect(editMock.fetchUserById).not.toHaveBeenCalled();
    });
  });

  // ── Arista 4→10 (Sí): Sí trae id → isOwnProfile = false ──
  describe('Arista 4→10 (Sí hay id → isOwnProfile = false)', () => {
    // Con id en la URL, se marca como perfil ajeno (isOwnProfile = false).
    it('A5-T1: con id en URL, isOwnProfile se establece en false', async () => {
      const { component, editMock } = await createComponent('99');
      editMock.fetchUserById.and.returnValue(Promise.resolve(MOCK_OTHER_USER));
      await component.ngOnInit();
      await wait();
      expect(component.isOwnProfile()).toBeFalse();
    });

    // Con id en la URL, se invoca fetchUserById pasándole el id '99' para pedir el perfil al backend.
    it('A5-T2: con id en URL, se invoca fetchUserById', async () => {
      const { component, editMock } = await createComponent('99');
      editMock.fetchUserById.and.returnValue(Promise.resolve(MOCK_OTHER_USER));
      await component.ngOnInit();
      await wait();
      expect(editMock.fetchUserById).toHaveBeenCalledWith('99');
    });
  });

  // ── Arista 5→6: isOwnProfile=true → ¿Hay usuario en cache? ──
  describe('Arista 5→6 (Perfil propio → verifica cache)', () => {
    // Verifica que al ser perfil propio, se consulta getCurrentUser para ver si hay usuario en cache.
    it('A6-T1: sin id, consulta getCurrentUser para verificar cache', async () => {
      const { component, authMock } = await createComponent(null);
      authMock.getCurrentUser.and.returnValue(MOCK_USER);
      await component.ngOnInit();
      await wait();
      expect(authMock.getCurrentUser).toHaveBeenCalled();
    });

    // Aunque no haya usuario en cache (null), getCurrentUser igualmente se llama para verificar.
    it('A6-T2: sin id, getCurrentUser se llama al menos una vez', async () => {
      const { component, authMock } = await createComponent(null);
      authMock.getCurrentUser.and.returnValue(null);
      await component.ngOnInit();
      await wait();
      expect(authMock.getCurrentUser).toHaveBeenCalled();
    });
  });

  // ── Arista 6→7 (No): Sin cache → verifyLoggedUser() ──
  describe('Arista 6→7 (Sin cache → verifyLoggedUser)', () => {
    // Si no hay usuario en cache (null), se valida la sesión llamando a verifyLoggedUser.
    it('A7-T1: si getCurrentUser retorna null, se llama verifyLoggedUser', async () => {
      const { component, authMock } = await createComponent(null);
      authMock.getCurrentUser.and.returnValue(null);
      await component.ngOnInit();
      await wait();
      expect(authMock.verifyLoggedUser).toHaveBeenCalled();
    });

    // Confirma que verifyLoggedUser se invoca exactamente 1 vez (no se repite innecesariamente).
    it('A7-T2: verifyLoggedUser se llama exactamente una vez cuando no hay cache', async () => {
      const { component, authMock } = await createComponent(null);
      authMock.getCurrentUser.and.returnValue(null);
      await component.ngOnInit();
      await wait();
      expect(authMock.verifyLoggedUser).toHaveBeenCalledTimes(1);
    });
  });

  // ── Arista 6→8 (Sí): Con cache → asignar datos ──
  describe('Arista 6→8 (Con cache → asignar datos directamente)', () => {
    // Si hay usuario en cache, NO se necesita validar sesión → verifyLoggedUser no se llama.
    it('A8-T1: si getCurrentUser retorna usuario, NO se llama verifyLoggedUser', async () => {
      const { component, authMock } = await createComponent(null);
      authMock.getCurrentUser.and.returnValue(MOCK_USER);
      authMock.verifyLoggedUser.calls.reset();
      await component.ngOnInit();
      await wait();
      expect(authMock.verifyLoggedUser).not.toHaveBeenCalled();
    });

    // Si hay cache, el usuario se asigna directamente al signal user() sin pasos adicionales.
    it('A8-T2: si hay cache, el usuario se asigna directamente al estado', async () => {
      const { component, authMock } = await createComponent(null);
      authMock.getCurrentUser.and.returnValue(MOCK_USER);
      await component.ngOnInit();
      await wait();
      expect(component.user()).toEqual(MOCK_USER);
    });
  });

  // ── Arista 7→8: verifyLoggedUser → asignar datos ──
  describe('Arista 7→8 (verifyLoggedUser → asignar datos)', () => {
    // Tras validar sesión con verifyLoggedUser, se vuelve a consultar getCurrentUser (2da llamada)
    // para obtener el usuario que fue seteado internamente por la validación.
    it('A9-T1: tras verifyLoggedUser, se vuelve a consultar getCurrentUser', async () => {
      const { component, authMock } = await createComponent(null);
      let callCount = 0;
      authMock.getCurrentUser.and.callFake(() => {
        callCount++;
        return callCount > 1 ? MOCK_USER : null;
      });
      await component.ngOnInit();
      await wait();
      expect(authMock.getCurrentUser).toHaveBeenCalledTimes(2);
    });

    // Verifica que después de verifyLoggedUser, el signal user() contiene el usuario recuperado de la sesión.
    it('A9-T2: tras verifyLoggedUser, user() refleja el usuario recuperado', async () => {
      const { component, authMock } = await createComponent(null);
      let callCount = 0;
      authMock.getCurrentUser.and.callFake(() => {
        callCount++;
        return callCount > 1 ? MOCK_USER : null;
      });
      await component.ngOnInit();
      await wait();
      expect(component.user()).toEqual(MOCK_USER);
    });
  });

  // ── Arista 8→9: Asignar datos → renderizar perfil propio ──
  describe('Arista 8→9 (Asignar datos → renderizar perfil propio)', () => {
    // Tras asignar los datos, el signal user() ya no es null → la vista puede renderizar.
    it('A10-T1: user() no es null tras asignar datos del perfil propio', async () => {
      const { component, authMock } = await createComponent(null);
      authMock.getCurrentUser.and.returnValue(MOCK_USER);
      await component.ngOnInit();
      await wait();
      expect(component.user()).not.toBeNull();
    });

    // Verifica que el username asignado al estado corresponde al usuario logueado ('testuser').
    it('A10-T2: el username del usuario asignado es correcto', async () => {
      const { component, authMock } = await createComponent(null);
      authMock.getCurrentUser.and.returnValue(MOCK_USER);
      await component.ngOnInit();
      await wait();
      expect(component.user()?.username).toBe('testuser');
    }); 
  });

  // ── Arista 9→FIN: Renderizar perfil propio → FIN ──
  describe('Arista 9→FIN (Renderizar perfil propio → Fin)', () => {
    // Al renderizar el perfil propio exitosamente, no se redirige a ninguna otra ruta.
    it('A11-T1: no se redirige a ninguna ruta al renderizar perfil propio', async () => {
      const { component, authMock, routerMock } = await createComponent(null);
      authMock.getCurrentUser.and.returnValue(MOCK_USER);
      await component.ngOnInit();
      await wait();
      expect(routerMock.navigate).not.toHaveBeenCalled();
    });

    // Confirma que al terminar el flujo de perfil propio, isOwnProfile sigue en true.
    it('A11-T2: isOwnProfile permanece true al finalizar flujo propio', async () => {
      const { component, authMock } = await createComponent(null);
      authMock.getCurrentUser.and.returnValue(MOCK_USER);
      await component.ngOnInit();
      await wait();
      expect(component.isOwnProfile()).toBeTrue();
    });
  });

  // ── Arista 10→11: isOwnProfile=false → fetchUserById(id) ──
  describe('Arista 10→11 (isOwnProfile=false → fetchUserById)', () => {
    // Al detectar id '42' en la ruta, se llama a fetchUserById('42') para pedir el perfil al backend.
    it('A12-T1: al tener id en ruta, se llama fetchUserById con ese id', async () => {
      const { component, editMock } = await createComponent('42');
      editMock.fetchUserById.and.returnValue(Promise.resolve(MOCK_OTHER_USER));
      await component.ngOnInit();
      await wait();
      expect(editMock.fetchUserById).toHaveBeenCalledWith('42');
    });

    // Verifica que fetchUserById se invoca exactamente 1 vez (evita llamadas duplicadas).
    it('A12-T2: fetchUserById se llama exactamente una vez', async () => {
      const { component, editMock } = await createComponent('42');
      editMock.fetchUserById.and.returnValue(Promise.resolve(MOCK_OTHER_USER));
      await component.ngOnInit();
      await wait();
      expect(editMock.fetchUserById).toHaveBeenCalledTimes(1);
    });
  });

  // ── Arista 11→12: fetchUserById → ¿autorizado? ──
  describe('Arista 11→12 (fetchUserById → evaluar respuesta)', () => {
    // Si fetchUserById retorna 'unauthorized', se detecta y se redirige (token inválido/faltante).
    it('A13-T1: resultado unauthorized se identifica correctamente', async () => {
      const { component, editMock, routerMock } = await createComponent('99');
      editMock.fetchUserById.and.returnValue(Promise.resolve('unauthorized'));
      await component.ngOnInit();
      await wait();
      expect(routerMock.navigate).toHaveBeenCalled();
    });

    // Si fetchUserById retorna un objeto User válido, se asigna al estado del componente.
    it('A13-T2: resultado con usuario válido se identifica correctamente', async () => {
      const { component, editMock } = await createComponent('99');
      editMock.fetchUserById.and.returnValue(Promise.resolve(MOCK_OTHER_USER));
      await component.ngOnInit();
      await wait();
      expect(component.user()).toEqual(MOCK_OTHER_USER);
    });
  });

  // ── Arista 12→13 (No): No autorizado → return "unauthorized" ──
  describe('Arista 12→13 (No autorizado → unauthorized)', () => {
    // Al recibir 'unauthorized', el componente redirige al usuario a /home.
    it('A14-T1: al recibir unauthorized, se navega a /home', async () => {
      const { component, editMock, routerMock } = await createComponent('99');
      editMock.fetchUserById.and.returnValue(Promise.resolve('unauthorized'));
      await component.ngOnInit();
      await wait();
      expect(routerMock.navigate).toHaveBeenCalledWith(['/home']);
    });

    // Al ser unauthorized, el signal user() no se modifica → permanece en null.
    it('A14-T2: al recibir unauthorized, user() permanece null', async () => {
      const { component, editMock } = await createComponent('99');
      editMock.fetchUserById.and.returnValue(Promise.resolve('unauthorized'));
      await component.ngOnInit();
      await wait();
      expect(component.user()).toBeNull();
    });
  });

  // ── Arista 12→14 (Sí): Autorizado → ¿usuario existe? ──
  describe('Arista 12→14 (Autorizado → evaluar existencia)', () => {
    // Si el backend retorna un usuario válido, user() se asigna con esos datos.
    it('A15-T1: usuario existe → user() se asigna', async () => {
      const { component, editMock } = await createComponent('99');
      editMock.fetchUserById.and.returnValue(Promise.resolve(MOCK_OTHER_USER));
      await component.ngOnInit();
      await wait();
      expect(component.user()).toBeTruthy();
    });

    // Si el backend retorna null (usuario no encontrado), user() permanece null.
    it('A15-T2: usuario no existe (null) → user() permanece null', async () => {
      const { component, editMock } = await createComponent('99');
      editMock.fetchUserById.and.returnValue(Promise.resolve(null));
      spyOn(Swal, 'fire').and.returnValue(Promise.resolve({} as any));
      await component.ngOnInit();
      await wait();
      expect(component.user()).toBeNull();
    });
  });

  // ── Arista 13→FIN: unauthorized → FIN ──
  describe('Arista 13→FIN (unauthorized → Fin)', () => {
    // Tras el caso unauthorized, el flujo termina con una redirección a /home.
    it('A16-T1: tras unauthorized, el flujo termina con redirección', async () => {
      const { component, editMock, routerMock } = await createComponent('99');
      editMock.fetchUserById.and.returnValue(Promise.resolve('unauthorized'));
      await component.ngOnInit();
      await wait();
      expect(routerMock.navigate).toHaveBeenCalledWith(['/home']);
    });

    // Tras unauthorized, ni user() ni activeTab se modifican → el estado queda intacto.
    it('A16-T2: tras unauthorized, no se intenta asignar usuario', async () => {
      const { component, editMock } = await createComponent('99');
      editMock.fetchUserById.and.returnValue(Promise.resolve('unauthorized'));
      await component.ngOnInit();
      await wait();
      expect(component.user()).toBeNull();
      expect(component.activeTab()).toBe('created'); // no se modifica
    });
  });

  // ── Arista 14→15 (No): Usuario no existe → Swal error ──
  describe('Arista 14→15 (Usuario no existe → Swal error)', () => {
    // Si fetchUserById retorna null (usuario no existe), se muestra un Swal de error al usuario.
    it('A17-T1: si fetchUserById retorna null, se muestra Swal error', async () => {
      const { component, editMock } = await createComponent('99');
      editMock.fetchUserById.and.returnValue(Promise.resolve(null));
      const swalSpy = spyOn(Swal, 'fire').and.returnValue(Promise.resolve({} as any));
      await component.ngOnInit();
      await wait();
      expect(swalSpy).toHaveBeenCalled();
    });

    // Verifica que el mensaje del Swal incluye el texto "Usuario no encontrado".
    it('A17-T2: el Swal contiene texto "Usuario no encontrado"', async () => {
      const { component, editMock } = await createComponent('99');
      editMock.fetchUserById.and.returnValue(Promise.resolve(null));
      const swalSpy = spyOn(Swal, 'fire').and.returnValue(Promise.resolve({} as any));
      await component.ngOnInit();
      await wait();
      const args = swalSpy.calls.mostRecent().args[0] as any;
      expect(args.text).toContain('Usuario no encontrado');
    });
  });

  // ── Arista 14→17 (Sí): Usuario existe → guardar usuario ──
  describe('Arista 14→17 (Usuario existe → guardar usuario)', () => {
    // Si el usuario existe, se guarda en el signal user() con todos sus datos.
    it('A18-T1: si fetchUserById retorna usuario, se guarda en user()', async () => {
      const { component, editMock } = await createComponent('99');
      editMock.fetchUserById.and.returnValue(Promise.resolve(MOCK_OTHER_USER));
      await component.ngOnInit();
      await wait();
      expect(component.user()).toEqual(MOCK_OTHER_USER);
    });

    // Confirma que el id del usuario guardado ('99') corresponde al que se solicitó en la URL.
    it('A18-T2: el id del usuario guardado coincide con el solicitado', async () => {
      const { component, editMock } = await createComponent('99');
      editMock.fetchUserById.and.returnValue(Promise.resolve(MOCK_OTHER_USER));
      await component.ngOnInit();
      await wait();
      expect(component.user()?.id).toBe('99');
    });
  });

  // ── Arista 15→16: Swal error → redirigir /home ──
  describe('Arista 15→16 (Swal error → redirigir /home)', () => {
    // Tras mostrar Swal de error porque el usuario no existe, se redirige a /home.
    it('A19-T1: tras Swal error por usuario inexistente, se redirige a /home', async () => {
      const { component, editMock, routerMock } = await createComponent('99');
      editMock.fetchUserById.and.returnValue(Promise.resolve(null));
      spyOn(Swal, 'fire').and.returnValue(Promise.resolve({} as any));
      await component.ngOnInit();
      await wait();
      expect(routerMock.navigate).toHaveBeenCalledWith(['/home']);
    });

    // Verifica que la redirección a /home se ejecuta exactamente 1 vez (sin duplicados).
    it('A19-T2: la redirección se ejecuta exactamente una vez', async () => {
      const { component, editMock, routerMock } = await createComponent('99');
      editMock.fetchUserById.and.returnValue(Promise.resolve(null));
      spyOn(Swal, 'fire').and.returnValue(Promise.resolve({} as any));
      await component.ngOnInit();
      await wait();
      expect(routerMock.navigate).toHaveBeenCalledTimes(1);
    });
  });

  // ── Arista 16→FIN: Redirigir /home → FIN ──
  describe('Arista 16→FIN (Redirigir /home → Fin)', () => {
    // Tras redirigir al home, user() sigue siendo null (nunca se asignó un usuario).
    it('A20-T1: tras redirigir, user() sigue null', async () => {
      const { component, editMock } = await createComponent('99');
      editMock.fetchUserById.and.returnValue(Promise.resolve(null));
      spyOn(Swal, 'fire').and.returnValue(Promise.resolve({} as any));
      await component.ngOnInit();
      await wait();
      expect(component.user()).toBeNull();
    });

    // Tras redirigir, isOwnProfile sigue en false (era perfil ajeno que no se encontró).
    it('A20-T2: tras redirigir, isOwnProfile es false', async () => {
      const { component, editMock } = await createComponent('99');
      editMock.fetchUserById.and.returnValue(Promise.resolve(null));
      spyOn(Swal, 'fire').and.returnValue(Promise.resolve({} as any));
      await component.ngOnInit();
      await wait();
      expect(component.isOwnProfile()).toBeFalse();
    });
  });

  // ── Arista 17→18: Guardar usuario → activeTab = created ──
  describe('Arista 17→18 (Guardar usuario → activeTab = created)', () => {
    // Al guardar el usuario de otro perfil, la pestaña activa se establece en 'created'.
    it('A21-T1: al guardar usuario de otro perfil, activeTab se pone en created', async () => {
      const { component, editMock } = await createComponent('99');
      editMock.fetchUserById.and.returnValue(Promise.resolve(MOCK_OTHER_USER));
      await component.ngOnInit();
      await wait();
      expect(component.activeTab()).toBe('created');
    });

    // Aunque activeTab estuviera en 'favorites', al ver otro perfil se sobreescribe a 'created'.
    it('A21-T2: activeTab no queda en favorites al ver otro perfil', async () => {
      const { component, editMock } = await createComponent('99');
      editMock.fetchUserById.and.returnValue(Promise.resolve(MOCK_OTHER_USER));
      component.activeTab.set('favorites');
      await component.ngOnInit();
      await wait();
      expect(component.activeTab()).not.toBe('favorites');
    });
  });

  // ── Arista 18→19: activeTab=created → renderizar perfil otro usuario ──
  describe('Arista 18→19 (activeTab=created → renderizar perfil otro)', () => {
    // Verifica que el signal user() contiene el username del otro usuario ('otheruser').
    it('A22-T1: user() contiene los datos del otro usuario', async () => {
      const { component, editMock } = await createComponent('99');
      editMock.fetchUserById.and.returnValue(Promise.resolve(MOCK_OTHER_USER));
      await component.ngOnInit();
      await wait();
      expect(component.user()?.username).toBe('otheruser');
    });

    // Al renderizar perfil de otro usuario, isOwnProfile se mantiene en false.
    it('A22-T2: isOwnProfile es false al renderizar perfil de otro', async () => {
      const { component, editMock } = await createComponent('99');
      editMock.fetchUserById.and.returnValue(Promise.resolve(MOCK_OTHER_USER));
      await component.ngOnInit();
      await wait();
      expect(component.isOwnProfile()).toBeFalse();
    });
  });

  // ── Arista 19→FIN: Renderizar perfil otro → FIN ──
  describe('Arista 19→FIN (Renderizar perfil otro → Fin)', () => {
    // Al renderizar exitosamente el perfil de otro usuario, no se redirige a ninguna ruta.
    it('A23-T1: no se redirige tras renderizar perfil de otro usuario', async () => {
      const { component, editMock, routerMock } = await createComponent('99');
      editMock.fetchUserById.and.returnValue(Promise.resolve(MOCK_OTHER_USER));
      await component.ngOnInit();
      await wait();
      expect(routerMock.navigate).not.toHaveBeenCalled();
    });

    // Valida el estado final completo: user=otheruser, activeTab=created, isOwnProfile=false.
    it('A23-T2: el estado final tiene user, activeTab=created, isOwnProfile=false', async () => {
      const { component, editMock } = await createComponent('99');
      editMock.fetchUserById.and.returnValue(Promise.resolve(MOCK_OTHER_USER));
      await component.ngOnInit();
      await wait();
      expect(component.user()).toEqual(MOCK_OTHER_USER);
      expect(component.activeTab()).toBe('created');
      expect(component.isOwnProfile()).toBeFalse();
    });
  });
});

// ─── Helper ──────────────────────────────────────────────
function wait(ms = 0): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function fixture(): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, 0));
}

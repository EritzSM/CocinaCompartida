import { TestBed } from '@angular/core/testing';
import { Router, ActivatedRoute } from '@angular/router';
import { Profile } from '../app/features/pages/profile/profile';
import { Auth } from '../app/shared/services/auth';
import { RecipeService } from '../app/shared/services/recipe';
import { EditProfileService } from '../app/shared/services/edit-profile.service';
import { User } from '../app/shared/interfaces/user';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  EDITAR PERFIL FRONT – Pruebas por camino (assertion, sin mocks)
//  3 caminos + 3 pruebas de fallo
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const USER: User = {
  id: '1', username: 'testuser', password: '',
  email: 'test@test.com', avatar: 'av.png', bio: 'mi bio',
};

const UPDATED: User = {
  id: '1', username: 'nuevoNombre', password: '',
  email: 'test@test.com', avatar: 'av.png', bio: 'nueva bio',
};

let _updateCalled = false;
let _updatePayload: any = null;

function stubs(updateResult: User | null) {
  _updateCalled = false;
  _updatePayload = null;
  return {
    auth: {
      getCurrentUser: () => USER,
      verifyLoggedUser: () => Promise.resolve(),
    },
    edit: {
      fetchUserById: () => Promise.resolve(null),
      uploadAvatar: () => Promise.resolve(undefined),
      updateProfile: (data: any) => {
        _updateCalled = true;
        _updatePayload = data;
        return Promise.resolve(updateResult);
      },
      deleteAccount: () => Promise.resolve(false),
    },
    recipe: { loadRecipes: () => {}, recipes: () => [] },
    router: { navigate: () => Promise.resolve(true) },
    route: { snapshot: { paramMap: { get: () => null } } },
  };
}

async function build(updateResult: User | null) {
  const s = stubs(updateResult);
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
  const comp = TestBed.createComponent(Profile).componentInstance;
  await comp.ngOnInit();
  await new Promise(r => setTimeout(r, 0));
  return comp;
}

describe('Editar Perfil Front – Pruebas por camino', () => {

  beforeEach(() => TestBed.resetTestingModule());
  afterEach(() => document.querySelectorAll('.swal2-container').forEach(el => el.remove()));

  // ──────────────────────────────────────────────────────────
  //  C1: 1→2→4→5→6→7→9→10→FIN
  //  Username válido, update exitoso → perfil actualizado
  // ──────────────────────────────────────────────────────────
  describe('C1: Username válido + update exitoso', () => {

    it('C1-T1: user() se actualiza con los datos nuevos', async () => {
      const comp = await build(UPDATED);
      comp.newUsername = 'nuevoNombre';
      comp.newBio = 'nueva bio';
      await comp.saveProfileUpdates();

      expect(comp.user()).toEqual(UPDATED);
    });

    it('C1-T2: el modal se cierra tras update exitoso', async () => {
      const comp = await build(UPDATED);
      comp.modalVisible = true;
      comp.newUsername = 'nuevoNombre';
      await comp.saveProfileUpdates();

      expect(comp.modalVisible).toBe(false);
    });

    it('C1-T3: isUpdating vuelve a false tras completar', async () => {
      const comp = await build(UPDATED);
      comp.newUsername = 'nuevoNombre';
      await comp.saveProfileUpdates();

      expect(comp.isUpdating).toBe(false);
    });

    it('C1-T4: el payload enviado contiene username y bio', async () => {
      const comp = await build(UPDATED);
      comp.newUsername = 'nuevoNombre';
      comp.newBio = 'nueva bio';
      comp.newAvatar = 'av.png';
      await comp.saveProfileUpdates();

      expect(_updatePayload.username).toBe('nuevoNombre');
      expect(_updatePayload.bio).toBe('nueva bio');
    });
  });

  // ──────────────────────────────────────────────────────────
  //  C2: 1→2→3→FIN
  //  Username vacío → Swal warning, no se envía update
  // ──────────────────────────────────────────────────────────
  describe('C2: Username vacío', () => {

    it('C2-T1: no se llama updateProfile si username está vacío', async () => {
      const comp = await build(UPDATED);
      comp.newUsername = '';
      await comp.saveProfileUpdates();

      expect(_updateCalled).toBe(false);
    });

    it('C2-T2: no se llama updateProfile si username son solo espacios', async () => {
      const comp = await build(UPDATED);
      comp.newUsername = '   ';
      await comp.saveProfileUpdates();

      expect(_updateCalled).toBe(false);
    });

    it('C2-T3: isUpdating permanece en false (nunca se activó)', async () => {
      const comp = await build(UPDATED);
      comp.newUsername = '';
      await comp.saveProfileUpdates();

      expect(comp.isUpdating).toBe(false);
    });
  });

  // ──────────────────────────────────────────────────────────
  //  C3: 1→2→4→5→6→7→8→FIN
  //  Username válido, update falla → modal abierto con error
  // ──────────────────────────────────────────────────────────
  describe('C3: Username válido + update falla', () => {

    it('C3-T1: user() NO se modifica cuando update retorna null', async () => {
      const comp = await build(null);
      comp.newUsername = 'intentoFallido';
      await comp.saveProfileUpdates();

      // user() sigue siendo USER original
      expect(comp.user()).toEqual(USER);
    });

    it('C3-T2: el modal permanece abierto tras fallo', async () => {
      const comp = await build(null);
      comp.modalVisible = true;
      comp.newUsername = 'intentoFallido';
      await comp.saveProfileUpdates();

      expect(comp.modalVisible).toBe(true);
    });

    it('C3-T3: isUpdating vuelve a false tras fallo', async () => {
      const comp = await build(null);
      comp.newUsername = 'intentoFallido';
      await comp.saveProfileUpdates();

      expect(comp.isUpdating).toBe(false);
    });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  ⛔ PRUEBAS QUE HACEN FALLAR EL CÓDIGO
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  describe('⛔ Fallos esperados (bugs)', () => {

    // BUG: Si newPassword tiene espacios en blanco, se incluye en el payload.
    // El spread (...(this.newPassword && { password: this.newPassword }))
    // convierte '   ' en truthy y envía la password con solo espacios.
    it('⛔ F1: password con solo espacios NO debería incluirse en el payload', async () => {
      const comp = await build(UPDATED);
      comp.newUsername = 'test';
      comp.newPassword = '   ';
      await comp.saveProfileUpdates();

      // FALLA: _updatePayload.password es '   ' porque '   ' es truthy
      expect(_updatePayload.password).toBeUndefined();
    });

    // BUG: No hay validación de longitud del username.
    // Un username de 1 solo carácter pasa la validación.
    it('⛔ F2: username de 1 carácter NO debería pasar la validación', async () => {
      const comp = await build(UPDATED);
      comp.newUsername = 'a';
      await comp.saveProfileUpdates();

      // FALLA: updateProfile se llama porque 'a'.trim() no es vacío
      expect(_updateCalled).toBe(false);
    });

    // BUG: saveProfileUpdates no es idempotente.
    // Si el usuario hace doble click rápido, se envían 2 requests
    // porque isUpdating se comprueba pero no se usa como guard.
    it('⛔ F3: doble llamada rápida NO debería enviar 2 requests', async () => {
      let callCount = 0;
      const s = stubs(UPDATED);
      s.edit.updateProfile = async (data: any) => {
        callCount++;
        await new Promise(r => setTimeout(r, 50));
        return UPDATED;
      };

      await TestBed.resetTestingModule();
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
      const comp = TestBed.createComponent(Profile).componentInstance;
      await comp.ngOnInit();
      await new Promise(r => setTimeout(r, 0));

      comp.newUsername = 'test';
      // Doble click simulado
      comp.saveProfileUpdates();
      comp.saveProfileUpdates();
      await new Promise(r => setTimeout(r, 200));

      // FALLA: callCount es 2 porque no hay guard de isUpdating
      expect(callCount).toBe(1);
    });
  });
});

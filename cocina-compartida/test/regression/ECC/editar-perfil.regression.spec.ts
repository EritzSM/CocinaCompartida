import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { Profile } from '../../../src/app/features/pages/profile/profile';
import { Auth } from '../../../src/app/shared/services/auth';
import { EditProfileService } from '../../../src/app/shared/services/edit-profile.service';
import { RecipeService } from '../../../src/app/shared/services/recipe';
import { User } from '../../../src/app/shared/interfaces/user';

type BuildOptions = {
  updateResult: User | null;
};

type Stubs = {
  auth: { getCurrentUser: jasmine.Spy; verifyLoggedUser: jasmine.Spy };
  edit: { updateProfile: jasmine.Spy };
  router: { navigate: jasmine.Spy };
  route: { snapshot: { paramMap: { get: () => string | null } } };
  recipe: { loadRecipes: jasmine.Spy; recipes: jasmine.Spy };
};

const USER: User = {
  id: '1',
  username: 'testuser',
  password: '',
  email: 'test@test.com',
  avatar: 'av.png',
  bio: 'bio',
};

const UPDATED: User = {
  id: '1',
  username: 'nuevo',
  password: '',
  email: 'test@test.com',
  avatar: 'av.png',
  bio: 'bio nueva',
};

function buildStubs(options: BuildOptions): Stubs {
  return {
    auth: {
      getCurrentUser: jasmine.createSpy('getCurrentUser').and.returnValue(USER),
      verifyLoggedUser: jasmine.createSpy('verifyLoggedUser'),
    },
    edit: {
      updateProfile: jasmine.createSpy('updateProfile').and.returnValue(Promise.resolve(options.updateResult)),
    },
    router: {
      navigate: jasmine.createSpy('navigate').and.returnValue(Promise.resolve(true)),
    },
    route: {
      snapshot: { paramMap: { get: () => null } },
    },
    recipe: {
      loadRecipes: jasmine.createSpy('loadRecipes'),
      recipes: jasmine.createSpy('recipes').and.returnValue([]),
    },
  };
}

async function buildComponent(options: BuildOptions) {
  const stubs = buildStubs(options);
  await TestBed.configureTestingModule({
    imports: [Profile],
    providers: [
      { provide: Auth, useValue: stubs.auth },
      { provide: EditProfileService, useValue: stubs.edit },
      { provide: RecipeService, useValue: stubs.recipe },
      { provide: Router, useValue: stubs.router },
      { provide: ActivatedRoute, useValue: stubs.route },
    ],
  }).compileComponents();

  const component = TestBed.createComponent(Profile).componentInstance;
  await component.ngOnInit();
  await new Promise(resolve => setTimeout(resolve, 0));
  return { component, stubs };
}

describe('Editar Perfil Regression Frontend', () => {
  beforeEach(() => TestBed.resetTestingModule());

  // Verifica que un update exitoso actualiza el usuario y cierra el modal.
  it('EditarPerfil_CuandoUpdateExitoso_DebeActualizarUsuarioYCerrarModal', async () => {
    // Arrange
    const { component } = await buildComponent({ updateResult: UPDATED });
    component.modalVisible = true;
    component.newUsername = 'nuevo';
    component.newBio = 'bio nueva';

    // Act
    await component.saveProfileUpdates();

    // Assert
    expect(component.user()).toEqual(UPDATED);
    expect(component.modalVisible).toBe(false);
  });

  // Verifica que un update fallido mantiene el usuario y el modal.
  it('EditarPerfil_CuandoUpdateFalla_DebeMantenerUsuarioYModal', async () => {
    // Arrange
    const { component } = await buildComponent({ updateResult: null });
    component.modalVisible = true;
    component.newUsername = 'nuevo';

    // Act
    await component.saveProfileUpdates();

    // Assert
    expect(component.user()).toEqual(USER);
    expect(component.modalVisible).toBe(true);
  });
});

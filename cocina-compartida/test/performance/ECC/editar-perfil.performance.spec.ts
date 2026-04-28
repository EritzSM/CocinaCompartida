import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { Profile } from '../../../src/app/features/pages/profile/profile';
import { Auth } from '../../../src/app/shared/services/auth';
import { EditProfileService } from '../../../src/app/shared/services/edit-profile.service';
import { RecipeService } from '../../../src/app/shared/services/recipe';
import { User } from '../../../src/app/shared/interfaces/user';

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

function buildStubs(updatePromise: Promise<User | null>): Stubs {
  return {
    auth: {
      getCurrentUser: jasmine.createSpy('getCurrentUser').and.returnValue(USER),
      verifyLoggedUser: jasmine.createSpy('verifyLoggedUser'),
    },
    edit: {
      updateProfile: jasmine.createSpy('updateProfile').and.returnValue(updatePromise),
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

async function buildComponent(stubs: Stubs) {
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
  return component;
}

describe('Editar Perfil Performance Frontend', () => {
  beforeEach(() => TestBed.resetTestingModule());

  // Verifica que isUpdating evita llamadas extra cuando ya esta en proceso.
  it('EditarPerfil_CuandoIsUpdatingEsTrue_NoDebeLlamarUpdate', async () => {
    // Arrange
    const stubs = buildStubs(Promise.resolve(USER));
    const component = await buildComponent(stubs);
    component.newUsername = 'nuevo';
    component.isUpdating = true;

    // Act
    await component.saveProfileUpdates();

    // Assert
    expect(stubs.edit.updateProfile).not.toHaveBeenCalled();
  });

  // Verifica que un doble click no dispara dos requests.
  it('EditarPerfil_CuandoDobleSubmit_DebeEnviarUnaSolaSolicitud', async () => {
    // Arrange
    let resolveUpdate: (value: User | null) => void = () => undefined;
    const updatePromise = new Promise<User | null>(resolve => {
      resolveUpdate = resolve;
    });
    const stubs = buildStubs(updatePromise);
    const component = await buildComponent(stubs);
    component.newUsername = 'nuevo';

    // Act
    component.saveProfileUpdates();
    component.saveProfileUpdates();
    resolveUpdate(USER);
    await updatePromise;

    // Assert
    expect(stubs.edit.updateProfile).toHaveBeenCalledTimes(1);
  });
});

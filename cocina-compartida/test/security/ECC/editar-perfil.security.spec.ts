import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import Swal from 'sweetalert2';
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

function buildStubs(): Stubs {
  return {
    auth: {
      getCurrentUser: jasmine.createSpy('getCurrentUser').and.returnValue(USER),
      verifyLoggedUser: jasmine.createSpy('verifyLoggedUser'),
    },
    edit: {
      updateProfile: jasmine.createSpy('updateProfile').and.returnValue(Promise.resolve(USER)),
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

async function buildComponent() {
  const stubs = buildStubs();
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

describe('Editar Perfil Security Frontend', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
    spyOn(Swal, 'fire').and.returnValue(Promise.resolve({} as any));
  });

  // Verifica que username invalido bloquea el update.
  it('EditarPerfil_CuandoUsernameCorto_NoDebeLlamarUpdateProfile', async () => {
    // Arrange
    const { component, stubs } = await buildComponent();
    component.newUsername = 'ab';

    // Act
    await component.saveProfileUpdates();

    // Assert
    expect(stubs.edit.updateProfile).not.toHaveBeenCalled();
  });

  // Verifica que password vacia no se envia en el payload.
  it('EditarPerfil_CuandoPasswordVacia_NoDebeEnviarPassword', async () => {
    // Arrange
    const { component, stubs } = await buildComponent();
    component.newUsername = 'nuevo';
    component.newPassword = '   ';

    // Act
    await component.saveProfileUpdates();

    // Assert
    const payload = stubs.edit.updateProfile.calls.mostRecent().args[0];
    expect(payload.password).toBeUndefined();
  });
});

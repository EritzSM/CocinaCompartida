import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { signal } from '@angular/core';
import { Profile } from '../features/pages/profile/profile';
import { EditProfileService } from '../shared/services/edit-profile.service';
import { Auth } from '../shared/services/auth';
import { RecipeService } from '../shared/services/recipe';
import { Recipe } from '../shared/interfaces/recipe';
import Swal from 'sweetalert2';

// --- Dummy helpers ---
function dummyRecipe(overrides: Partial<Recipe> = {}): Recipe {
  return {
    id: 'r1', name: 'Test', descripcion: 'Desc', ingredients: ['a'],
    steps: ['s1'], images: ['img.jpg'], user: { id: 'u1', username: 'chef' },
    category: 'postres', likes: 0, likedBy: [], comments: [],
    ...overrides
  };
}

describe('Profile Component', () => {
  let component: Profile;
  let fixture: ComponentFixture<Profile>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockAuth: any;
  let mockEdit: any;
  const recipesSignal = signal<Recipe[]>([]);
  let mockRecipeService: any;

  beforeEach(async () => {
    // Arrange — Mocks, Stubs, Spies
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);
    mockRouter.navigate.and.returnValue(Promise.resolve(true));

    mockAuth = {
      getCurrentUser: jasmine.createSpy('getCurrentUser').and.returnValue({
        id: 'u1', username: 'testuser', email: 'test@test.com', bio: 'bio', avatar: 'av.jpg', password: ''
      }),
      isLoged: signal(true),
      currentUser: signal(null),
      currentUsername: signal('testuser'),
      verifyLoggedUser: jasmine.createSpy('verifyLoggedUser')
    };

    mockEdit = {
      uploadAvatar: jasmine.createSpy('uploadAvatar').and.returnValue(Promise.resolve('new-av.jpg')),
      updateProfile: jasmine.createSpy('updateProfile').and.returnValue(Promise.resolve({
        id: 'u1', username: 'updated', email: 'test@test.com', bio: 'bio', avatar: 'av.jpg', password: ''
      })),
      fetchUserById: jasmine.createSpy('fetchUserById').and.returnValue(Promise.resolve(null)),
      deleteAccount: jasmine.createSpy('deleteAccount').and.returnValue(Promise.resolve(false))
    };

    mockRecipeService = { recipes: recipesSignal };

    spyOn(Swal, 'fire').and.returnValue(Promise.resolve({ isConfirmed: false, isDenied: false, isDismissed: true } as any));

    await TestBed.configureTestingModule({
      imports: [Profile, CommonModule, FormsModule],
      providers: [
        { provide: Router, useValue: mockRouter },
        { provide: Auth, useValue: mockAuth },
        { provide: EditProfileService, useValue: mockEdit },
        { provide: RecipeService, useValue: mockRecipeService },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => null } } } }
      ]
    }).overrideComponent(Profile, {
      set: { template: '<div></div>', imports: [CommonModule, FormsModule] }
    }).compileComponents();

    fixture = TestBed.createComponent(Profile);
    component = fixture.componentInstance;
    recipesSignal.set([]);
    fixture.detectChanges();
  });

  // PR-01: selectTab cambia activeTab
  it('PR-01: selectTab sets activeTab', () => {
    // Act
    component.selectTab('favorites');

    // Assert
    expect(component.activeTab()).toBe('favorites');
  });

  // PR-02: openUpdateProfile llena los campos del modal
  it('PR-02: openUpdateProfile populates form fields and opens modal', () => {
    // Arrange
    component.user.set({
      id: 'u1', username: 'testuser', email: 'test@test.com',
      bio: 'my bio', avatar: 'av.jpg', password: ''
    });

    // Act
    component.openUpdateProfile();

    // Assert
    expect(component.modalVisible).toBe(true);
    expect(component.newUsername).toBe('testuser');
    expect(component.newBio).toBe('my bio');
    expect(component.newAvatar).toBe('av.jpg');
  });

  // PR-03: closeUpdateProfile oculta el modal
  it('PR-03: closeUpdateProfile hides modal', () => {
    // Arrange
    component.modalVisible = true;

    // Act
    component.closeUpdateProfile();

    // Assert
    expect(component.modalVisible).toBe(false);
  });

  // PR-04: saveProfileUpdates con username corto muestra warning
  it('PR-04: saveProfileUpdates with short username shows warning', async () => {
    // Arrange
    component.newUsername = 'ab';

    // Act
    await component.saveProfileUpdates();

    // Assert
    expect(Swal.fire).toHaveBeenCalled();
    expect(mockEdit.updateProfile).not.toHaveBeenCalled();
  });

  // PR-05: saveProfileUpdates cuando isUpdating retorna sin hacer nada
  it('PR-05: saveProfileUpdates when isUpdating returns early', async () => {
    // Arrange
    component.isUpdating = true;

    // Act
    await component.saveProfileUpdates();

    // Assert
    expect(mockEdit.updateProfile).not.toHaveBeenCalled();
  });

  // PR-06: onAvatarSelected sin archivo no llama a upload
  it('PR-06: onAvatarSelected with no file does nothing', async () => {
    // Arrange
    const event = { target: { files: [] } };

    // Act
    await component.onAvatarSelected(event);

    // Assert
    expect(mockEdit.uploadAvatar).not.toHaveBeenCalled();
  });

  // PR-07: createdRecipes filtra recetas por username del usuario actual
  it('PR-07: createdRecipes filters by user.username', () => {
    // Arrange
    component.user.set({ id: 'u1', username: 'testuser', email: '', bio: '', password: '' });
    recipesSignal.set([
      dummyRecipe({ id: 'r1', user: { id: 'u1', username: 'testuser' } }),
      dummyRecipe({ id: 'r2', user: { id: 'u2', username: 'other' } }),
      dummyRecipe({ id: 'r3', user: { id: 'u1', username: 'testuser' } })
    ]);

    // Act
    const result = component.createdRecipes();

    // Assert
    expect(result.length).toBe(2);
    expect(result.every(r => r.user.username === 'testuser')).toBe(true);
  });

  // PR-08: displayedRecipes devuelve createdRecipes en tab 'created'
  it('PR-08: displayedRecipes returns createdRecipes when tab is created', () => {
    // Arrange
    component.activeTab.set('created');

    // Act
    const displayed = component.displayedRecipes();
    const created = component.createdRecipes();

    // Assert
    expect(displayed).toEqual(created);
  });

  // PR-09: deleteAccount exitoso navega a /login
  it('PR-09: deleteAccount on success navigates to /login', async () => {
    // Arrange
    mockEdit.deleteAccount.and.returnValue(Promise.resolve(true));

    // Act
    await component.deleteAccount();

    // Assert
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
  });

  // PR-10: saveProfileUpdates exitoso actualiza user y cierra modal
  it('PR-10: saveProfileUpdates success updates user and closes modal', async () => {
    // Arrange
    component.newUsername = 'validname';
    component.newBio = 'updated bio';
    component.modalVisible = true;
    const updatedUser = { id: 'u1', username: 'validname', email: 'e@e.com', bio: 'updated bio', avatar: 'av.jpg', password: '' };
    mockEdit.updateProfile.and.returnValue(Promise.resolve(updatedUser));

    // Act
    await component.saveProfileUpdates();

    // Assert
    expect(component.user()).toEqual(updatedUser);
    expect(component.modalVisible).toBe(false);
    expect(component.isUpdating).toBe(false);
  });
});

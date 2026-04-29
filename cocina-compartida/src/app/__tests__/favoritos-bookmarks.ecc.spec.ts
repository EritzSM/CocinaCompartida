import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, provideRouter } from '@angular/router';
import { Profile } from '../features/pages/profile/profile';
import { Auth } from '../shared/services/auth';
import { EditProfileService } from '../shared/services/edit-profile.service';
import { RecipeService } from '../shared/services/recipe';
import { Recipe } from '../shared/interfaces/recipe';

const RECIPES: Recipe[] = [
  {
    id: 'r1',
    name: 'Favorita',
    descripcion: 'Guardada',
    ingredients: ['a'],
    steps: ['b'],
    images: [],
    category: 'cena',
    user: { id: 'chef', username: 'chef' },
    likes: 1,
    likedBy: ['u-current'],
  },
  {
    id: 'r2',
    name: 'No favorita',
    descripcion: 'No guardada',
    ingredients: ['a'],
    steps: ['b'],
    images: [],
    category: 'desayuno',
    user: { id: 'chef', username: 'chef' },
    likes: 0,
    likedBy: [],
  },
];

function fakeSignal<T>(initialValue: T) {
  const fn: any = () => initialValue;
  fn.asReadonly = () => fn;
  return fn;
}

describe('Favoritos Bookmarks ECC - Profile', () => {
  let component: Profile;
  let auth: any;

  beforeEach(() => {
    auth = {
      getCurrentUser: jasmine.createSpy('getCurrentUser').and.returnValue({ id: 'u-current', username: 'yo' }),
      verifyLoggedUser: jasmine.createSpy('verifyLoggedUser'),
    };

    TestBed.configureTestingModule({
      imports: [Profile],
      providers: [
        provideRouter([]),
        { provide: Router, useValue: { navigate: jasmine.createSpy('navigate') } },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => null } } } },
        { provide: Auth, useValue: auth },
        { provide: RecipeService, useValue: { recipes: fakeSignal<Recipe[]>(RECIPES) } },
        {
          provide: EditProfileService,
          useValue: {
            fetchUserById: jasmine.createSpy('fetchUserById'),
            updateProfile: jasmine.createSpy('updateProfile'),
            uploadAvatar: jasmine.createSpy('uploadAvatar'),
            deleteAccount: jasmine.createSpy('deleteAccount'),
          },
        },
      ],
    });

    component = TestBed.createComponent(Profile).componentInstance;
  });

  it('Dado perfil propio, cuando selecciona favoritos, entonces muestra recetas donde likedBy contiene al usuario actual', async () => {
    await component.ngOnInit();
    component.selectTab('favorites');

    expect(component.favoriteRecipes().length).toBe(1);
    expect(component.displayedRecipes()[0].id).toBe('r1');
  });

  it('Dado perfil ajeno, cuando calcula favoritos, entonces no expone favoritos del usuario actual', () => {
    component.isOwnProfile.set(false);

    expect(component.favoriteRecipes()).toEqual([]);
  });
});

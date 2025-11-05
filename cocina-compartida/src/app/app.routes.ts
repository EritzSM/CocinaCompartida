import { Routes } from '@angular/router';
import { Login } from './features/pages/login/login';
import { SignUp } from './features/pages/sign-up/sign-up';
import { Home } from './features/pages/home/home';
import { RecipeUpload} from './features/pages/recipe-upload/recipe-upload';
import { Explore } from './features/pages/explore/explore';
import { Profile } from './features/pages/profile/profile';
import { RecipeDetail } from './features/pages/recipe-detail/recipe-detail';


export const routes: Routes = [
  { 
    path: '', 
    component: Home
},
    { 
    path: 'home', 
    component: Home 
},  
  { path: 'login', 
    component: Login 
},
  { 
    path: 'sign-up', 
    component: SignUp 
},
  { 
    path: 'recipe-upload', 
    component: RecipeUpload
},
  {
    path: 'explore',
    component: Explore
  },
  {
    path: 'profile',
    component: Profile
  },
  {
    path: 'profile/:id',
    component: Profile
  },
  { 
    path: 'recipe/:id/edit', 
    component: RecipeUpload
  },
    { 
    path: 'recipe/:id', 
    component: RecipeDetail 
  },
  { 
    path: '**', 
    redirectTo: '' 
}

];

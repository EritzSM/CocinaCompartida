import { Routes } from '@angular/router';
import { Login } from './features/pages/login/login';
import { SignUp } from './features/pages/sign-up/sign-up';
import { Home } from './features/pages/home/home';
import { RecipeUpload} from './features/pages/recipe-upload/recipe-upload';
import { Explore } from './features/pages/explore/explore';

export const routes: Routes = [
  { 
    path: '', 
    component: RecipeUpload
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
    path: '**', 
    redirectTo: '' 
}

];

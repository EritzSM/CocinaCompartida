import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth } from '../services/auth';

export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(Auth);
  const router = inject(Router);

  // We should make sure the logged user state is updated before checking.
  auth.verifyLoggedUser();

  if (auth.isAuthenticated()) {
    return true;
  }

  // Not logged in, redirect to login page.
  return router.parseUrl('/login');
};

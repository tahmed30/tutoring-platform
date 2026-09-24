import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { AuthStore } from '../../state/auth.store';
import { RoleName } from '../models';

export const authGuard: CanActivateFn = () => {
  const authStore = inject(AuthStore);
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authStore.isAuthenticated()) {
    return true;
  }

  const refreshToken = authStore.getRefreshToken();
  if (!refreshToken) {
    return router.createUrlTree(['/login']);
  }

  return authService.tryRestoreSession().pipe(
    map((ok) => (ok ? true : router.createUrlTree(['/login']))),
  );
};

export const guestGuard: CanActivateFn = () => {
  const authStore = inject(AuthStore);
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authStore.isAuthenticated()) {
    return router.createUrlTree([authService.dashboardPathForRole(authStore.primaryRole())]);
  }

  if (!authStore.getRefreshToken()) {
    return true;
  }

  return authService.tryRestoreSession().pipe(
    map((ok) =>
      ok
        ? router.createUrlTree([authService.dashboardPathForRole(authStore.primaryRole())])
        : true,
    ),
  );
};

export const roleGuard: CanActivateFn = (route) => {
  const authStore = inject(AuthStore);
  const authService = inject(AuthService);
  const router = inject(Router);
  const roles = (route.data['roles'] as RoleName[] | undefined) ?? [];

  const check = (): boolean | ReturnType<Router['createUrlTree']> => {
    if (!authStore.isAuthenticated()) {
      return router.createUrlTree(['/login']);
    }
    if (!roles.length || authStore.hasRole(...roles)) {
      return true;
    }
    return router.createUrlTree([authService.dashboardPathForRole(authStore.primaryRole())]);
  };

  if (authStore.isAuthenticated()) {
    return check();
  }

  if (!authStore.getRefreshToken()) {
    return router.createUrlTree(['/login']);
  }

  return authService.tryRestoreSession().pipe(map(() => check()));
};

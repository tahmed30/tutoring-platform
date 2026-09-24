import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { AuthStore } from '../../state/auth.store';
import { API_BASE_URL } from '../api/api.config';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authStore = inject(AuthStore);
  const authService = inject(AuthService);

  const isApiRequest = req.url.startsWith(API_BASE_URL);
  const isAuthEndpoint =
    req.url.includes('/auth/login') ||
    req.url.includes('/auth/register') ||
    req.url.includes('/auth/refresh');

  const token = authStore.accessToken();
  const authReq =
    isApiRequest && token && !isAuthEndpoint
      ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
      : req;

  return next(authReq).pipe(
    catchError((error) => {
      if (error?.status !== 401 || !isApiRequest || isAuthEndpoint || req.headers.has('X-Retry')) {
        return throwError(() => error);
      }
      return authService.refreshAccessToken().pipe(
        switchMap((accessToken) =>
          next(
            req.clone({
              setHeaders: {
                Authorization: `Bearer ${accessToken}`,
                'X-Retry': '1',
              },
            }),
          ),
        ),
        catchError((refreshError) => {
          authService.logout();
          return throwError(() => refreshError);
        }),
      );
    }),
  );
};

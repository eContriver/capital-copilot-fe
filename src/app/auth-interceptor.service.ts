import { Injectable } from '@angular/core';
import { HttpEvent, HttpInterceptor, HttpHandler, HttpRequest } from '@angular/common/http';
import { Observable, from } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';
import { AuthService, AuthUrls } from './auth.service';
import { Router } from '@angular/router';

@Injectable()
export class AuthInterceptorService implements HttpInterceptor {
  private excludedUrls = Object.values(AuthUrls);

  constructor(
    private authService: AuthService,
    private router: Router,
  ) {}

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    if (this.excludedUrls.some((url) => req.url.includes(url))) {
      return next.handle(req);
    }

    if (this.authService.isRefreshTokenExpired()) {
      this.authService.logout();
      console.debug('AuthInterceptor: Redirecting to login page (refresh token expired)');
      this.router.navigate(['/login']);
      return new Observable<HttpEvent<unknown>>();
    }

    return from(this.authService.getTokenObservable()).pipe(
      switchMap((token) => {
        if (token) {
          req = req.clone({
            setHeaders: {
              Authorization: `Bearer ${token}`,
            },
          });
        }
        return next.handle(req).pipe(
          catchError((error) => {
            if (error.status === 401) {
              this.authService.logout();
              console.debug('AuthInterceptor: Redirecting to login page (failed to authenticate)');
              this.router.navigate(['/login']);
            }
            throw error;
          }),
        );
      }),
    );
  }
}

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { AuthService } from '../auth.service';
import { LoginComponent } from './login.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { createTestJWT } from '../jwt';
import { ToolbarService } from '../toolbar.service';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;
  let mockToolbarService: jasmine.SpyObj<ToolbarService>;

  beforeEach(async () => {
    mockToolbarService = jasmine.createSpyObj('ToolbarService', ['getViewContainerRef']);
    const mockViewContainerRef = jasmine.createSpyObj('ViewContainerRef', ['clear', 'createEmbeddedView']);
    mockToolbarService.getViewContainerRef.and.returnValue(mockViewContainerRef);
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['login', 'getErrors']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, LoginComponent, HttpClientTestingModule, NoopAnimationsModule],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: ToolbarService, useValue: mockToolbarService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    fixture.detectChanges();
  });

  it('should create', () => {
    // fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  // it('should set up the toolbar with the toolbar template', () => {
  //   fixture.detectChanges();
  //   expect(mockToolbarService.getViewContainerRef).toHaveBeenCalled();
  //   expect(mockToolbarService.getViewContainerRef().clear).toHaveBeenCalled();
  //   expect(mockToolbarService.getViewContainerRef().createEmbeddedView)
  //      .toHaveBeenCalledWith(component.toolbarTemplate);
  // });

  it('should call AuthService login on form submit', () => {
    authService.getErrors.and.returnValue([]);
    authService.login.and.returnValue(
      of({
        access: createTestJWT({}),
        refresh: createTestJWT({}, 3600 * 24),
      }),
    );
    component.loginForm.setValue({ username: 'testuser', password: 'testpassword' });
    component.onSubmit();

    expect(authService.login).toHaveBeenCalledWith('testuser', 'testpassword');
    expect(router.navigate).toHaveBeenCalledWith(['/charts']);
  });

  it('should display validation errors when form is invalid', () => {
    component.loginForm.setValue({ username: '', password: '' });

    const usernameControl = component.loginForm.controls['username'];
    const passwordControl = component.loginForm.controls['password'];

    expect(usernameControl.valid).toBeFalse();
    expect(passwordControl.valid).toBeFalse();

    expect(usernameControl.errors).toEqual({ required: true });
    expect(passwordControl.errors).toEqual({ required: true });
  });

  it('should be valid when form is filled correctly', () => {
    component.loginForm.setValue({ username: 'testuser', password: 'testpassword' });

    expect(component.loginForm.valid).toBeTrue();
  });
});

import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoginModel, RegisterModel } from '../models/auth.model';
import { RootModel } from '../models/root.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);

  login(model: LoginModel): Observable<RootModel> {
    const url = `${environment.main_url}/Account/Login`;
    const payload = {
      userNameOrEmailOrPhone: model.userNameOrEmail || (model as any).userNameOrEmailOrPhone || '',
      password: model.password,
    };
    return this.http.post<RootModel>(url, payload);
  }

  register(model: RegisterModel): Observable<RootModel> {
    const url = `${environment.main_url}/Account/Register`;
    return this.http.post<RootModel>(url, model);
  }
}

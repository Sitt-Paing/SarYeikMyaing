import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class LoggerService {
  log(message: any, ...optionalParams: any[]) {
    if (environment.debug) {
      console.log(message, ...optionalParams);
    }
  }

  error(message: any, ...optionalParams: any[]) {
    if (environment.debug) {
      console.error(message, ...optionalParams);
    }
  }

  warn(message: any, ...optionalParams: any[]) {
    if (environment.debug) {
      console.warn(message, ...optionalParams);
    }
  }
}

import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  login(email: string, password: string): void {
    console.log('Logging in with:', email, password);
    // Add real API call here
  }

  register(email: string, password: string): void {
    console.log('Registering with:', email, password);
    // Add real API call here
  }
}

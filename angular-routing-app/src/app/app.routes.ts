import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { AboutComponent } from './about/about.component';
import { LoginComponent } from './auth/login/login.component';
import { RegisterComponent } from './auth/register/register.component';

export const routes: Routes = [
  { path: '', component: HomeComponent }, // Default route
  { path: 'about', component: AboutComponent }, // About page
  { path: 'auth/login', component: LoginComponent }, // Login page
  { path: 'auth/register', component: RegisterComponent }, // Register page
  { path: '**', redirectTo: '' }, // Fallback route
];

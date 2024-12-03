import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: { username: string; password: string; role: string }) {
    return this.authService.register(dto.username, dto.password, dto.role);
  }

  @Post('login')
  async login(@Body() dto: { username: string; password: string }) {
    const user = await this.authService.validateUser(dto.username, dto.password);
    if (!user) {
      throw new Error('Invalid credentials');
    }
    return this.authService.login(user);
  }
}
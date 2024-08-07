import { Body, Controller, Post, Res } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { AuthService } from './auth.service'
import { LoginDto } from './dtos/login.dto'
import { Response } from 'express'
import { CreateUserDto } from 'src/users/dtos/create-user.dto'
@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor (private readonly authService: AuthService) {}

  @ApiOperation({ summary: 'Iniciar sesión' })
  @Post('login')
  async logIn (@Body() body: LoginDto, @Res({ passthrough: true }) res: Response): Promise<{ isSuccessful: string }> {
    const { accessToken, refreshToken } = await this.authService.logIn(body)

    // Establece las cookies
    res.cookie('access_token', accessToken, { httpOnly: true, secure: true })
    res.cookie('refresh_token', refreshToken, { httpOnly: true, secure: true })

    return { isSuccessful: 'Login exitoso' }
  }

  @ApiOperation({ summary: 'Registrarse' })
  @Post('signIn')
  async signIn (@Body() body: CreateUserDto, @Res({ passthrough: true }) res: Response): Promise<{ isSuccessful: string }> {
    const { accessToken, refreshToken } = await this.authService.signIn(body)

    // Establece las cookies
    res.cookie('access_token', accessToken, { httpOnly: true, secure: true })
    res.cookie('refresh_token', refreshToken, { httpOnly: true, secure: true })

    return { isSuccessful: 'Registro exitoso' }
  }

  @ApiOperation({ summary: 'Cerrar sesión' })
  @Post('logOut')
  async logOut (@Res({ passthrough: true }) res: Response): Promise<{ isSuccessful: string }> {
    res.clearCookie('access_token', { path: '/' })
    res.clearCookie('refresh_token', { path: '/' })

    return { isSuccessful: 'Sesión cerrada con éxito' }
  }
}

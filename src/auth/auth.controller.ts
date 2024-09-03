import { Body, Controller, Post } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { AuthService } from './auth.service'
import { LoginDto } from './dtos/login.dto'
import { CreateUserDto } from 'src/users/dtos/create-user.dto'
@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor (private readonly authService: AuthService) {}

  @ApiOperation({ summary: 'Iniciar sesión' })
  @Post('login')
  async logIn (@Body() body: LoginDto): Promise<{
    accessToken: string
    refreshToken: string
  }> {
    const { accessToken, refreshToken } = await this.authService.logIn(body)

    return { accessToken, refreshToken }
  }

  @ApiOperation({ summary: 'Registrarse' })
  @Post('signIn')
  async signIn (@Body() body: CreateUserDto): Promise<{
    accessToken: string
    refreshToken: string
  }> {
    const { accessToken, refreshToken } = await this.authService.signIn(body)

    return { accessToken, refreshToken }
  }

  @ApiOperation({ summary: 'Cerrar sesión' })
  @Post('logOut')
  async logOut (): Promise<{ isSuccessful: string }> {
    return { isSuccessful: 'Sesión cerrada con éxito' }
  }
}

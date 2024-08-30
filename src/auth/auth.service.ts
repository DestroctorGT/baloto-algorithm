import { HttpException, HttpStatus, Injectable } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { UsersService } from 'src/users/users.service'
import * as bcrypt from 'bcrypt'
import { type LoginDto } from './dtos/login.dto'
import { type CreateUserDto } from 'src/users/dtos/create-user.dto'
import { ConfigService } from '@nestjs/config'

@Injectable()
export class AuthService {
  constructor (
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService
  ) {}

  async logIn (body: LoginDto): Promise<{
    accessToken: string
    refreshToken: string
  }> {
    const { userName, password } = body

    const user = await this.usersService.findOne(userName)

    const isValid = (user != null) ? await bcrypt.compare(password, user?.password) : false

    if (!isValid) throw new HttpException('La contraseña es incorrecta', HttpStatus.UNAUTHORIZED)

    const payload = { sub: user?.id, username: user?.username }

    const JWT_SECRET = this.configService.get('SECRET_JWT_KEY')

    const accessToken = await this.jwtService.signAsync(payload, { expiresIn: '1h', secret: JWT_SECRET })

    const refreshToken = await this.jwtService.signAsync(payload, { expiresIn: '7d', secret: JWT_SECRET })

    return { accessToken, refreshToken }
  }

  async signIn (body: CreateUserDto): Promise<{ accessToken: string, refreshToken: string }> {
    const userCreated = await this.usersService.create(body)

    const payload = { sub: userCreated.id, username: userCreated.username }

    const JWT_SECRET = this.configService.get('SECRET_JWT_KEY')

    const accessToken = await this.jwtService.signAsync(payload, { expiresIn: '1h', secret: JWT_SECRET })

    const refreshToken = await this.jwtService.signAsync(payload, { expiresIn: '7d', secret: JWT_SECRET })

    return { accessToken, refreshToken }
  }
}

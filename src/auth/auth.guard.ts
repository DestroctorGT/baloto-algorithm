import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  UnauthorizedException
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import { type Request } from 'express'

@Injectable()
export class AuthGuard implements CanActivate {
  constructor (private readonly jwtService: JwtService, private readonly configService: ConfigService) {}

  async canActivate (context: ExecutionContext): Promise<boolean> {
    const JWT_SECRET = this.configService.get('SECRET_JWT_KEY')

    const request = context.switchToHttp().getRequest()
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const token = this.extractTokenFromCookies(request)
    if (token == null) {
      throw new UnauthorizedException()
    }
    try {
      const payload = await this.jwtService.verifyAsync(
        token,
        {
          secret: JWT_SECRET
        }
      )
      // 💡 We're assigning the payload to the request object here
      // so that we can access it in our route handlers
      request.user = payload
    } catch {
      throw new UnauthorizedException()
    }
    return true
  }

  private extractTokenFromCookies (request: Request): string | undefined {
    const token = request.cookies.access_token

    return token
  }
}

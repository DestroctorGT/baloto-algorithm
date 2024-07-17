import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  UnauthorizedException
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import { type Request, type Response } from 'express'

@Injectable()
export class AuthGuard implements CanActivate {
  constructor (private readonly jwtService: JwtService, private readonly configService: ConfigService) {}

  async canActivate (context: ExecutionContext): Promise<boolean> {
    const JWT_SECRET = this.configService.get('SECRET_JWT_KEY')

    const request = context.switchToHttp().getRequest()
    const response = context.switchToHttp().getResponse<Response>()
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
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        const refreshToken = this.extractRefreshTokenFromCookies(request)

        if (refreshToken == null) {
          throw new UnauthorizedException('Refresh token missing')
        }

        try {
          const refreshPayload = await this.jwtService.verifyAsync(
            refreshToken,
            {
              secret: JWT_SECRET
            }
          )
          const newAccessToken = await this.jwtService.signAsync(
            { userId: refreshPayload.userId },
            {
              secret: JWT_SECRET,
              expiresIn: '1h'
            }
          )

          response.cookie('access_token', newAccessToken, { httpOnly: true })

          const newPayload = await this.jwtService.verifyAsync(
            newAccessToken,
            {
              secret: JWT_SECRET
            }
          )
          request.user = newPayload
        } catch {
          throw new UnauthorizedException('Invalid refresh token')
        }
      } else {
        throw new UnauthorizedException('Invalid access token')
      }
    }
    return true
  }

  private extractTokenFromCookies (request: Request): string | undefined {
    const token = request.cookies.access_token

    return token
  }

  private extractRefreshTokenFromCookies (request: Request): string | undefined {
    const token = request.cookies.refresh_token

    return token
  }
}

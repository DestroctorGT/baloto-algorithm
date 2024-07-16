import { ApiProperty } from '@nestjs/swagger'
import { IsString } from 'class-validator'

export class LoginDto {
  @ApiProperty({
    description: 'Nombre de usuario',
    example: 'GinoTb24',
    required: true
  })
  @IsString()
    userName: string

  @ApiProperty({
    description: 'Contraseña',
    example: 'Prueba123@',
    required: true
  })
  @IsString()
    password: string
}

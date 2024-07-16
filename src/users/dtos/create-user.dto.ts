import { ApiProperty } from '@nestjs/swagger'
import { IsEmail, IsString } from 'class-validator'

export class CreateUserDto {
  @ApiProperty({
    description: 'Nombre de usuario',
    example: 'GinoTb24',
    required: true
  })
  @IsString()
    userName: string

  @ApiProperty({
    description: 'Nombre',
    example: 'Gino',
    required: true
  })
  @IsString()
    name: string

  @ApiProperty({
    description: 'Apellido',
    example: 'Tapia Barrios',
    required: true
  })
  @IsString()
    lastName: string

  @ApiProperty({
    description: 'Correo electrónico',
    example: 'example@gmail.com',
    required: true
  })
  @IsEmail()
    email: string

  @ApiProperty({
    description: 'Contraseña',
    example: 'Prueba123@',
    required: true
  })
  @IsString()
    password: string
}

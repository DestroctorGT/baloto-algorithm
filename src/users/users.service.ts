import { BadRequestException, HttpException, HttpStatus, Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { type CreateUserDto } from './dtos/create-user.dto'
import { User } from './entities/user.entity'
import * as bcrypt from 'bcrypt'
import { createUserSchema } from './create-user.schema'
import { ValidationError } from 'yup'

const SALT = process.env.SALT_ROUNDS ?? 10

@Injectable()
export class UsersService {
  constructor (@InjectRepository(User)
  private readonly usersRepository: Repository<User>) {}

  async create (body: CreateUserDto): Promise<User> {
    try {
      await createUserSchema.validate(body, { abortEarly: false })

      const { userName, name, lastName, email, password } = body

      await this.findUserExist(userName)

      const hashedPassword = await bcrypt.hash(password, SALT)

      const userCreated = await this.usersRepository.save({ username: userName, name, lastName, email, password: hashedPassword })

      return userCreated
    } catch (err) {
      if (err instanceof ValidationError) {
        throw new BadRequestException(err.errors)
      }
      throw err
    }
  }

  async findOne (username: string): Promise<User | null> {
    const userExist = await this.usersRepository.findOne({ where: [{ username }, { email: username }] })

    if (userExist == null) {
      throw new HttpException('El usuario no existe', HttpStatus.NOT_FOUND)
    }

    return userExist
  }

  async findUserExist (username: string): Promise<void> {
    const userExist = await this.usersRepository.findOne({
      where: [{ username }, { email: username }]
    })

    if (userExist !== null) {
      throw new HttpException('El usuario ya existe', HttpStatus.CONFLICT)
    }
  }
}

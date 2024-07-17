/* eslint-disable @typescript-eslint/strict-boolean-expressions */
import { Module } from '@nestjs/common'
import { ScheduleModule } from '@nestjs/schedule'
import { ConfigModule } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
import { BalotoService } from './baloto/baloto.service'
import { BalotoController } from './baloto/baloto.controller'
import { BalotoModule } from './baloto/baloto.module'
import { TestsService } from './test/tests.service'
import { TestController } from './test/test.controller'
import { AuthModule } from './auth/auth.module'
import { UsersModule } from './users/users.module'

const envFilePath = process.env.NODE_ENV ? '.env.' + process.env.NODE_ENV : '.env'

@Module({
  imports: [ScheduleModule.forRoot(), ConfigModule.forRoot({
    envFilePath,
    isGlobal: true
  }), TypeOrmModule.forRoot({
    type: 'postgres', // type of our database
    host: process.env.DB_HOST, // database host
    port: parseInt(process.env.DB_PORT ?? '5432'), // database port
    username: process.env.DB_USERNAME, // username
    password: process.env.DB_PASSWORD, // user password
    database: process.env.DB_NAME, // name of our database,
    retryDelay: parseInt(process.env.RETRY_DELAY ?? '3000'),
    autoLoadEntities: JSON.parse(process.env.AUTO_LOAD_ENTITIES ?? 'false') as boolean, // models will be loaded automatically
    synchronize: JSON.parse(process.env.SYNCHRONIZE ?? 'false') as boolean, // your entities will be synced with the database(recommended: disable in prod)
    migrations: ['migration/*.js'],
    ssl: {
      rejectUnauthorized: process.env.SSL_REJECT_UNAUTHORIZED === 'true'
    }
  }), BalotoModule, AuthModule, UsersModule],
  controllers: [BalotoController, TestController],
  providers: [BalotoService, TestsService]
})
export class AppModule {}

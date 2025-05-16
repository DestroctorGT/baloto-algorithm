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
    type: 'postgres',
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT?.toString() ?? '5432'),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    retryDelay: parseInt(process.env.RETRY_DELAY ?? '3000'),
    autoLoadEntities: JSON.parse(process.env.AUTO_LOAD_ENTITIES ?? 'false') as boolean,
    synchronize: JSON.parse(process.env.SYNCHRONIZE ?? 'false') as boolean,
    migrations: ['migration/*.js'],
    ssl: JSON.parse(process.env.SSL_REJECT_UNAUTHORIZED ?? 'true')
      ? {
          rejectUnauthorized: false
        }
      : undefined
  }), BalotoModule, AuthModule, UsersModule],
  controllers: [BalotoController, TestController],
  providers: [BalotoService, TestsService]
})
export class AppModule {}

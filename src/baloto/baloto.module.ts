import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { LastBalotoResults } from './entities/last-results.entity'
import { BalotoController } from './baloto.controller'
import { BalotoService } from './baloto.service'
import { MiLotoResults } from './entities/miloto.entity'

@Module({
  imports: [
    TypeOrmModule.forFeature([LastBalotoResults, MiLotoResults])
  ],
  exports: [TypeOrmModule],
  controllers: [BalotoController],
  providers: [BalotoService]
})
export class BalotoModule {}

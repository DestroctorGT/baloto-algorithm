import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { LastBalotoResults } from './entities/last-results.entity'
import { BalotoController } from './baloto.controller'
import { BalotoService } from './baloto.service'

@Module({
  imports: [
    TypeOrmModule.forFeature([LastBalotoResults])
  ],
  exports: [TypeOrmModule],
  controllers: [BalotoController],
  providers: [BalotoService]
})
export class BalotoModule {}

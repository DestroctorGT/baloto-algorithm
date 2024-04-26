import { Controller, Post } from '@nestjs/common'
import { BalotoService } from './baloto.service'
import { type LastBalotoResults } from './entities/last-results.entity'

@Controller('baloto')
export class BalotoController {
  constructor (private readonly balotoService: BalotoService) {}

  @Post()
  async postLastBalotoResult (): Promise<LastBalotoResults | undefined> {
    return await this.balotoService.saveLastBalotoResult()
  }
}

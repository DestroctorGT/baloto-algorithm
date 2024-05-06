import { Controller, Get, Post } from '@nestjs/common'
import { BalotoService } from './baloto.service'
import { type LastBalotoResults } from './entities/last-results.entity'
import { ApiOperation, ApiTags } from '@nestjs/swagger'

@ApiTags('baloto')
@Controller('baloto')
export class BalotoController {
  constructor (private readonly balotoService: BalotoService) {}

  @ApiOperation({ summary: 'Obtener todos los resultados de baloto' })
  @Get('last-baloto-results')
  async findAllBalotoResults (): Promise<LastBalotoResults[]> {
    return await this.balotoService.findAllBalotoResults()
  }

  @ApiOperation({ summary: 'Obtener todos los resultados de baloto revancha' })
  @Get('last-baloto-rematch-results')
  async findAllBalotoRematchResults (): Promise<LastBalotoResults[]> {
    return await this.balotoService.findAllBalotoRematchResults()
  }

  @Post()
  async postLastBalotoResult (): Promise<LastBalotoResults | undefined> {
    return await this.balotoService.saveLastBalotoResult()
  }
}

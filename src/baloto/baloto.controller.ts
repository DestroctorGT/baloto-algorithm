import { Controller, Get, Post, Query, UseGuards } from '@nestjs/common'
import { BalotoService } from './baloto.service'
import { type LastBalotoResults } from './entities/last-results.entity'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { type MiLotoResults } from './entities/miloto.entity'
import { FindAllMilotoResultsDto } from './dtos/find-all-miloto-results.dto'
import { AuthGuard } from 'src/auth/auth.guard'

@ApiTags('baloto')
@Controller('baloto')
export class BalotoController {
  constructor (private readonly balotoService: BalotoService) {}

  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Obtener todos los resultados de baloto' })
  @Get('last-baloto-results')
  async findAllBalotoResults (): Promise<LastBalotoResults[]> {
    return await this.balotoService.findAllBalotoResults()
  }

  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Obtener todos los resultados de baloto revancha' })
  @Get('last-baloto-rematch-results')
  async findAllBalotoRematchResults (): Promise<LastBalotoResults[]> {
    return await this.balotoService.findAllBalotoRematchResults()
  }

  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Obtener todos los resultados de miLoto' })
  @Get('last-miloto-results')
  async findAllMilotoResults (@Query() query: FindAllMilotoResultsDto): Promise<MiLotoResults[]> {
    return await this.balotoService.findAllMilotoResults(query)
  }

  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Generar el posible numero siguiente de baloto (sin revancha)' })
  @Get('generate-next-baloto')
  async generatePossibleBalotoNumber (): Promise<{
    possibleNumber: number[]
    superBalota: number
  }> {
    return await this.balotoService.generatePossibleBalotoNumber()
  }

  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Generar el posible numero siguiente de miLoto' })
  @Get('generate-next-miloto')
  async generatePossibleMilotoNumber (): Promise<number[]> {
    return await this.balotoService.generatePossibleMilotoNumbers()
  }

  @ApiOperation({ summary: 'Cron job que guarda el ultimo resultado de baloto' })
  @Post()
  async postLastBalotoResult (): Promise<LastBalotoResults | undefined> {
    return await this.balotoService.saveLastBalotoResult()
  }

  @ApiOperation({ summary: 'Cron job que guarda el ultimo resultado de miLoto' })
  @Post('miloto')
  async postLastMilotoResult (): Promise<MiLotoResults | undefined> {
    return await this.balotoService.saveLastMiLotoResult()
  }
}

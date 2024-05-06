import { Controller, Get } from '@nestjs/common'
import { TestsService } from './tests.service'
import { ApiTags, ApiOperation } from '@nestjs/swagger'
@ApiTags('pruebas api')
@Controller('test')
export class TestController {
  constructor (private readonly testService: TestsService) {}

  @ApiOperation({ summary: 'Endpoint para mantener la app activa' })
  @Get()
  async testApi (): Promise<boolean | undefined> {
    return await this.testService.testApi()
  }
}

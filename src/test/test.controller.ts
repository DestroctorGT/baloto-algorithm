import { Controller, Get } from '@nestjs/common'
import { TestsService } from './tests.service'

@Controller('test')
export class TestController {
  constructor (private readonly testService: TestsService) {}

  @Get()
  async testApi (): Promise<boolean | undefined> {
    return await this.testService.testApi()
  }
}

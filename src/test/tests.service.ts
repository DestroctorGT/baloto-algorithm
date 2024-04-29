// Este archivo solo funcionara hasta cuando pueda actualizar el web service en render.com

import { Injectable } from '@nestjs/common'

@Injectable()
export class TestsService {
  async testApi (): Promise<boolean> {
    return true
  }
}

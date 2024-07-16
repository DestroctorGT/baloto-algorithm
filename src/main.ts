import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import * as cookieParser from 'cookie-parser'

const port = process.env.PORT ?? 4000

async function bootstrap (): Promise<void> {
  const app = await NestFactory.create(AppModule)
  app.use(cookieParser())
  const config = new DocumentBuilder()
    .setTitle('API Algoritmo baloto')
    .setVersion('0.0.1')
    .build()

  const document = SwaggerModule.createDocument(app, config)

  SwaggerModule.setup('api/docs', app, document, {
    explorer: true,
    swaggerOptions: {
      filter: true,
      showRequestDuration: true
    }
  })

  await app.listen(port)
}
void bootstrap()

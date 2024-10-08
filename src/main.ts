import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { TransformInterceptor } from './interceptors/transform.interceptor'

const port = process.env.PORT ?? 4000

async function bootstrap (): Promise<void> {
  const app = await NestFactory.create(AppModule)
  const config = new DocumentBuilder()
    .setTitle('API Algoritmo baloto')
    .setVersion('0.0.1')
    .build()

  const document = SwaggerModule.createDocument(app, config)

  // Habilitar CORS
  app.enableCors({
    origin: ['https://baloto-generator.vercel.app', 'http://localhost:3000'],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE'
  })
  app.useGlobalInterceptors(new TransformInterceptor())

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

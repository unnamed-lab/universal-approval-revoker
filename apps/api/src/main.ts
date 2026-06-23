import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix("api/v1");
  app.enableCors({ origin: process.env["FRONTEND_URL"] ?? "*" });
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));

  const swaggerConfig = new DocumentBuilder()
    .setTitle("Universal Approval Revoker API")
    .setDescription("Scan and revoke SPL token delegations on Solana")
    .setVersion("1.0")
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup("docs", app, document);

  const port = process.env["PORT"] ?? 3001;
  await app.listen(port);
  console.log(`API running on http://localhost:${port}`);
}

bootstrap();

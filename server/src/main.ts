import { NestFactory } from '@nestjs/core';
import express, { type Request, type Response, type NextFunction } from 'express';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bodyParser: false,
  });

  app.enableCors({
    origin: ['http://localhost:3000'],
    credentials: true,
  });

  // Apply Express body parsing only for non-Better-Auth routes
  const jsonParser = express.json();
  const urlencodedParser = express.urlencoded({ extended: true });

  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.originalUrl.startsWith('/api/auth')) {
      return next();
    }
    jsonParser(req, res, (err) => {
      if (err) return next(err);
      urlencodedParser(req, res, next);
    });
  });

  const port = process.env.PORT ?? 3001;
  await app.listen(port);
  console.log(`Server is running on: http://localhost:${port}`);
}
await bootstrap();

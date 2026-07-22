import 'reflect-metadata';
import * as path from 'path';
import * as tsConfigPaths from 'tsconfig-paths';

const rootDir = path.resolve(__dirname, '..');
tsConfigPaths.register({
  baseUrl: rootDir,
  paths: {
    '@auth-template/core': [
      path.join(rootDir, 'packages/core/src/index.ts'),
      path.join(rootDir, 'packages/core/src/index'),
      path.join(rootDir, 'packages/core/dist/index'),
    ],
    '@auth-template/core/*': [
      path.join(rootDir, 'packages/core/src/*'),
      path.join(rootDir, 'packages/core/dist/*'),
    ],
    '@auth-template/typeorm': [
      path.join(rootDir, 'packages/typeorm/src/index.ts'),
      path.join(rootDir, 'packages/typeorm/src/index'),
      path.join(rootDir, 'packages/typeorm/dist/index'),
    ],
    '@auth-template/typeorm/*': [
      path.join(rootDir, 'packages/typeorm/src/*'),
      path.join(rootDir, 'packages/typeorm/dist/*'),
    ],
    '@auth-template/nestjs-adapter': [
      path.join(rootDir, 'packages/nestjs-adapter/src/index.ts'),
      path.join(rootDir, 'packages/nestjs-adapter/src/index'),
      path.join(rootDir, 'packages/nestjs-adapter/dist/index'),
    ],
    '@auth-template/nestjs-adapter/*': [
      path.join(rootDir, 'packages/nestjs-adapter/src/*'),
      path.join(rootDir, 'packages/nestjs-adapter/dist/*'),
    ],
    '@auth-template/express-adapter': [
      path.join(rootDir, 'packages/express-adapter/src/index.ts'),
      path.join(rootDir, 'packages/express-adapter/src/index'),
      path.join(rootDir, 'packages/express-adapter/dist/index'),
    ],
    '@auth-template/express-adapter/*': [
      path.join(rootDir, 'packages/express-adapter/src/*'),
      path.join(rootDir, 'packages/express-adapter/dist/*'),
    ],
  },
});

import '@nestjs/core';
import '@nestjs/common';
import '@nestjs/typeorm';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from '../apps/demo/src/app.module';
import helmet from 'helmet';
import compression from 'compression';
import express from 'express';
import { ExpressAdapter } from '@nestjs/platform-express';

const server = express();
let isInitialized = false;

async function bootstrapServer() {
  if (!isInitialized) {
    const app = await NestFactory.create(
      AppModule,
      new ExpressAdapter(server),
    );

    const configService = app.get(ConfigService);

    app.use(helmet());
    app.enableCors({
      origin: configService.get('CORS_ORIGIN', '*'),
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    });
    app.use(compression());

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );

    app.setGlobalPrefix('api', {
      exclude: ['health'],
    });

    server.get('/', (req: any, res: any) => {
      res.redirect('/api');
    });

    const config = new DocumentBuilder()
      .setTitle('Enterprise Auth API')
      .setDescription('The API documentation for the Enterprise Auth Template')
      .setVersion('1.0')
      .addTag('Authentication')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'JWT',
          description: 'Enter JWT access token',
          in: 'header',
        },
        'bearer',
      )
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document, {
      customCssUrl:
        'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui.min.css',
      customJs: [
        'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui-bundle.js',
        'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui-standalone-preset.js',
      ],
      customSiteTitle: 'Enterprise Auth API Docs',
    });

    await app.init();
    isInitialized = true;
  }
  return server;
}

export default async function handler(req: any, res: any) {
  try {
    await bootstrapServer();
    server(req, res);
  } catch (err: any) {
    console.error('Vercel Serverless Function Error:', err);
    res.status(500).json({
      statusCode: 500,
      error: 'Internal Server Error',
      message: err?.message || 'Serverless function initialization failed',
    });
  }
}

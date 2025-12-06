import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager'; // <--- NUEVO
import * as redisStore from 'cache-manager-ioredis'; // <--- NUEVO (El driver)
import * as Joi from 'joi';
import { ToursModule } from './modules/tours/tours.module';

@Module({
  imports: [
    // 1. Variables de Entorno
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        DB_HOST: Joi.string().required(),
        DB_PORT: Joi.number().default(5435), // Tu puerto seguro
        DB_USERNAME: Joi.string().required(),
        DB_PASSWORD: Joi.string().required(),
        DB_NAME: Joi.string().required(),
        REDIS_HOST: Joi.string().required(),
        REDIS_PORT: Joi.number().default(6379),
      }),
    }),

    // 2. CONFIGURACIÓN DE REDIS CACHÉ (NUEVO)
    CacheModule.registerAsync({
      isGlobal: true, // Disponible en toda la app sin importar de nuevo
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        store: redisStore,
        host: configService.get('REDIS_HOST'), // localhost
        port: configService.get('REDIS_PORT'), // 6379
        ttl: 60, // Tiempo de vida por defecto: 60 segundos
      }),
    }),

    // 3. Base de Datos
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_NAME'),
        autoLoadEntities: true,
        synchronize: true,
      }),
    }),

    ToursModule,
  ],
})
export class AppModule {}
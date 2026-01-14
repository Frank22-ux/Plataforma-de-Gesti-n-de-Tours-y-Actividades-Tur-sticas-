import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import { ScheduleModule } from '@nestjs/schedule'; 
import * as redisStore from 'cache-manager-ioredis';
import * as Joi from 'joi';

// Módulos de la Aplicación
import { ToursModule } from './modules/tours/tours.module';
import { PricingModule } from './modules/pricing/pricing.module';
import { AuthModule } from './modules/auth/auth.module';
import { BookingsModule } from './modules/bookings/bookings.module';
import { UsersModule } from './modules/users/users.module'; // <--- 1. IMPORTAR ESTO

@Module({
  imports: [
    // 1. Configuración de Variables de Entorno
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        DB_HOST: Joi.string().required(),
        DB_PORT: Joi.number().default(5435),
        DB_USERNAME: Joi.string().required(),
        DB_PASSWORD: Joi.string().required(),
        DB_NAME: Joi.string().required(),
        REDIS_HOST: Joi.string().required(),
        REDIS_PORT: Joi.number().default(6379),
        JWT_SECRET: Joi.string().required(),
      }),
    }),

    // 2. Activamos el motor de tareas programadas (Cron)
    ScheduleModule.forRoot(),

    // 3. Configuración de Redis
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        store: redisStore,
        host: configService.get('REDIS_HOST'),
        port: configService.get('REDIS_PORT'),
        ttl: 60,
      }),
    }),

    // 4. Base de Datos
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

    // --- MÓDULOS DE NEGOCIO ---
    ToursModule,
    PricingModule,
    AuthModule,
    BookingsModule,
    UsersModule, // <--- 2. AGREGAR AQUÍ
  ],
})
export class AppModule {}
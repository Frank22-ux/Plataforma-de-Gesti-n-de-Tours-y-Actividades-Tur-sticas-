import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ToursModule } from './modules/tours/tours.module';
import * as Joi from 'joi';

@Module({
  imports: [
    // 1. CARGAR VARIABLES DE ENTORNO (.env)
    ConfigModule.forRoot({
      isGlobal: true, // Disponible en toda la app
      validationSchema: Joi.object({
        DB_HOST: Joi.string().required(),
        DB_PORT: Joi.number().default(5432),
        DB_USERNAME: Joi.string().required(),
        DB_PASSWORD: Joi.string().required(),
        DB_NAME: Joi.string().required(),
        REDIS_HOST: Joi.string().required(),
      }),
    }),

    // 2. CONEXIÓN A BASE DE DATOS (PostgreSQL)
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
        synchronize: true, // ¡OJO! En producción esto debe ser FALSE
      }),
    }),

    ToursModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { User } from './entities/user.entity';
import { JwtStrategy } from './jwt.strategy'; // <--- Importamos el archivo

@Module({
  imports: [
    // 1. Conexión a la tabla de usuarios
    TypeOrmModule.forFeature([User]),
    
    // 2. Estrategia de autenticación por defecto
    PassportModule.register({ defaultStrategy: 'jwt' }),

    // 3. Configuración del Generador de Tokens (JWT)
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'), // Lee del .env
        signOptions: { expiresIn: '24h' }, // El token expira en 24 horas
      }),
    }),
  ],
  controllers: [AuthController],
  
  // --- CORRECCIÓN CRÍTICA AQUÍ ---
  // Agregamos JwtStrategy para que NestJS la instancie y registre en Passport
  providers: [AuthService, JwtStrategy],
  
  // Exportamos también la estrategia por si acaso
  exports: [TypeOrmModule, PassportModule, JwtModule, AuthService, JwtStrategy],
})
export class AuthModule {}
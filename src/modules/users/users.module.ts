import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from '../auth/entities/user.entity'; // Importamos la entidad de Auth

@Module({
  imports: [TypeOrmModule.forFeature([User])], // Registramos la tabla Users
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService], // Exportamos por si otros módulos necesitan buscar usuarios
})
export class UsersModule {}
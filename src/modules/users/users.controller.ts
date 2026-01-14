import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('users')
@UseGuards(AuthGuard('jwt')) // 🔒 Todas las rutas de este controlador requieren estar logueado
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // 1. Crear un Guía (Ruta específica)
  // POST /users/guides
  @Post('guides') 
  createGuide(@Body() createUserDto: CreateUserDto) {
    return this.usersService.createGuide(createUserDto);
  }

  // 2. Listar solo Guías (Para llenar selectores en el frontend)
  // GET /users/guides
  @Get('guides') 
  findGuides() {
    return this.usersService.findGuides();
  }

  // 3. Listar todos los usuarios (Para la tabla de administración)
  // GET /users
  @Get() 
  findAll() {
    return this.usersService.findAll();
  }

  // 4. Eliminar un usuario
  // DELETE /users/:id
  @Delete(':id') 
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
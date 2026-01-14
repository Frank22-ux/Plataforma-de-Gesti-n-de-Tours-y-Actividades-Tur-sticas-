import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from '../auth/entities/user.entity'; // Reutilizamos la entidad de Auth
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcryptjs'; // Usamos la librería compatible con Windows

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  // --- CREAR GUÍA (Solo Admin) ---
  async createGuide(createUserDto: CreateUserDto) {
    const { email, password, name } = createUserDto;

    // 1. Verificar si el correo ya existe
    const existingUser = await this.userRepository.findOne({ where: { email } });
    if (existingUser) {
      throw new ConflictException('El correo ya está registrado');
    }

    // 2. Encriptar contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. Crear usuario FORZANDO el rol de GUÍA
    const user = this.userRepository.create({
      email,
      password: hashedPassword,
      name,
      role: UserRole.GUIDE, // <--- Aquí está la clave
    });

    await this.userRepository.save(user);

    // 4. Retornar datos sin la contraseña
    return {
      message: 'Guía creado exitosamente',
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    };
  }

  // --- LISTAR TODOS LOS USUARIOS ---
  async findAll() {
    return this.userRepository.find({
      order: { createdAt: 'DESC' },
      select: ['id', 'name', 'email', 'role', 'isActive', 'createdAt'], // No devolvemos password
    });
  }

  // --- LISTAR SOLO GUÍAS (Para selectores) ---
  async findGuides() {
    return this.userRepository.find({
      where: { role: UserRole.GUIDE },
      select: ['id', 'name', 'email'],
      order: { name: 'ASC' },
    });
  }

  // --- ELIMINAR USUARIO ---
  async remove(id: string) {
    const user = await this.userRepository.findOneBy({ id });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return this.userRepository.remove(user);
  }
}
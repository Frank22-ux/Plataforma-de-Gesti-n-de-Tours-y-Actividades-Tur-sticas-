import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { RegisterAuthDto } from './dto/register-auth.dto';
import { LoginAuthDto } from './dto/login-auth.dto';
import * as bcrypt from 'bcryptjs'; // <--- CAMBIO: Usamos bcryptjs
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  // --- REGISTRO ---
  async register(registerDto: RegisterAuthDto) {
    // 1. Sanitización: Email a minúsculas y sin espacios
    const emailLimpio = registerDto.email.toLowerCase().trim();
    const { password, name, role } = registerDto;

    // 2. Encriptar con bcryptjs
    const hashedPassword = await bcrypt.hash(password, 10);

    try {
      const user = this.userRepository.create({
        email: emailLimpio, // Guardamos el limpio
        password: hashedPassword,
        name: name,
        role: role,
      });
      
      await this.userRepository.save(user);

      return {
        message: 'Usuario registrado exitosamente',
        userId: user.id,
        email: user.email,
      };

    } catch (error) {
      if (error.code === '23505') {
        throw new ConflictException('El correo electrónico ya está registrado');
      }
      throw error;
    }
  }

  // --- LOGIN ---
  async login(loginDto: LoginAuthDto) {
    // 1. Sanitización: Limpiamos lo que entra igual que en el registro
    const emailLimpio = loginDto.email.toLowerCase().trim();
    const { password } = loginDto;

    // 2. Buscar usuario
    const user = await this.userRepository.findOne({ where: { email: emailLimpio } });
    
    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas (Email no existe)');
    }

    // 3. Comparar contraseñas
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas (Contraseña incorrecta)');
    }

    // 4. Generar Token
    const payload = { email: user.email, sub: user.id, role: user.role };
    
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name
      }
    };
  }
}
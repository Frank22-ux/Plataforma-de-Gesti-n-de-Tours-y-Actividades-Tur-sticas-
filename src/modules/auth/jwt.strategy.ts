import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      // CORRECCIÓN: Agregamos "|| 'secret'" para garantizar que nunca sea undefined
      secretOrKey: configService.get<string>('JWT_SECRET') || 'secretKeyDefault',
    });
  }

  async validate(payload: any) {
    const { email } = payload;
    const user = await this.userRepository.findOne({ where: { email } });

    if (!user) {
      throw new UnauthorizedException('Token no válido o usuario inexistente');
    }

    // Ahora sí funcionará user.name porque ya actualizamos la entidad
    return { id: user.id, email: user.email, role: user.role, name: user.name }; 
  }
}
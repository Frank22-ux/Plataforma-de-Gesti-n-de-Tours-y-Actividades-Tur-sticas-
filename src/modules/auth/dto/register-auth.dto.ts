import { IsEmail, IsNotEmpty, IsString, MinLength, Matches, IsEnum } from 'class-validator';
import { UserRole } from '../entities/user.entity'; // <--- 1. Importamos el Enum

export class RegisterAuthDto {
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  @IsString()
  name: string;

  @IsNotEmpty({ message: 'El correo es obligatorio' })
  @IsEmail({}, { message: 'Formato de correo inválido' })
  @Matches(/@gmail\.com$/, { 
    message: 'Solo se permiten correos de Google (@gmail.com)' 
  })
  email: string;

  @IsNotEmpty({ message: 'La contraseña es obligatoria' })
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, { 
    message: 'La contraseña debe tener: 1 Mayúscula, 1 Número y 1 Carácter Especial' 
  })
  password: string;

  @IsNotEmpty()
  // 2. VALIDACIÓN: Usamos IsEnum en lugar de IsString
  @IsEnum(UserRole, { 
    message: 'El rol debe ser válido: traveler, guide o admin' 
  })
  role: UserRole; // <--- 3. Cambiamos el tipo de 'string' a 'UserRole'
}
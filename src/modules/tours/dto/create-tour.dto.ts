import { IsString, IsNumber, IsNotEmpty, IsObject, Min, IsOptional } from 'class-validator';

export class CreateTourDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  // El precio suele llegar como string desde el FormData, pero idealmente lo transformamos antes.
  // Si usas ValidationPipe con transform: true, intentará convertirlo.
  @IsNumber()
  @Min(0)
  price: number;

  // --- NUEVA VALIDACIÓN: CATEGORÍA ---
  @IsString()
  @IsOptional()
  category?: string;

  // --- NUEVA VALIDACIÓN: STOCK ---
  // Usamos 'any' o 'string | number' para evitar errores de validación 
  // cuando el FormData envía el número como texto "10".
  @IsOptional()
  stock?: any;

  @IsObject()
  @IsNotEmpty()
  location: {
    type: string;
    coordinates: number[];
  };
}
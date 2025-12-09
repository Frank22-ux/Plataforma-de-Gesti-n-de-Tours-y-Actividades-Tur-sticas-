import { IsString, IsNumber, IsNotEmpty, IsObject, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateTourDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsNumber()
  @Min(0)
  price: number;

  // Validación básica para GeoJSON
  @IsObject()
  @IsNotEmpty()
  location: {
    type: string;       // Debe ser "Point"
    coordinates: number[]; // [longitud, latitud]
  };
}
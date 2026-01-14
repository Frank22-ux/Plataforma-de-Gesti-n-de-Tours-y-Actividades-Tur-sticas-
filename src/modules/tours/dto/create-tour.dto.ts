import { IsString, IsNumber, IsNotEmpty, IsObject, Min, IsOptional, IsBoolean, IsArray } from 'class-validator';
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

  @IsString()
  @IsOptional()
  category?: string;

  @IsOptional()
  stock?: any; // Recibe string del form, se convierte en controller

  // --- NUEVOS CAMPOS ---
  @IsOptional()
  startDate?: string;

  @IsOptional()
  endDate?: string;

  @IsOptional()
  guideIds?: any; // Puede venir como JSON string o array

  @IsOptional()
  isAdultOnly?: any; // String "true"/"false" del form

  @IsOptional()
  hasLodging?: any;

  @IsOptional()
  lodgingDays?: any;

  @IsOptional()
  lodgingNights?: any;

  @IsOptional()
  lodgingRooms?: any;

  @IsOptional()
  hasTransport?: any;

  @IsOptional()
  transportType?: string;

  @IsOptional()
  hasFood?: any;

  @IsObject()
  @IsNotEmpty()
  location: {
    type: string;
    coordinates: number[];
  };
}
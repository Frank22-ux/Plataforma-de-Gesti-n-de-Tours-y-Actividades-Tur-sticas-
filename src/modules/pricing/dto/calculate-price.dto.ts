import { IsString, IsNotEmpty, IsISO8601 } from 'class-validator';

// TIENE QUE DECIR "export class", no solo "class"
export class CalculatePriceDto { 
  @IsString()
  @IsNotEmpty()
  tourId: string;

  @IsISO8601()
  bookingDate: string;
}
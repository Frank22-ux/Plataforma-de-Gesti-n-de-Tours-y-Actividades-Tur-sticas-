import { IsString, IsNotEmpty, IsISO8601, IsInt, Min } from 'class-validator';

export class CreateBookingDto {
  @IsString()
  @IsNotEmpty()
  tourId: string; // ¿Qué vas a comprar?

  @IsISO8601()
  bookingDate: string; // ¿Para cuándo? (YYYY-MM-DD)

  @IsInt()
  @Min(1)
  peopleCount: number; // ¿Cuántos tickets?
}
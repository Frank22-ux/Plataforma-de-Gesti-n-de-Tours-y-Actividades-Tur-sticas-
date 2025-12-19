import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookingsService } from './bookings.service';
import { BookingsController } from './bookings.controller';
import { Booking } from './entities/booking.entity';
import { ToursModule } from '../tours/tours.module'; // <--- IMPORTANTE: Necesitamos ToursService

@Module({
  imports: [
    // 1. Registramos la entidad para que TypeORM cree la tabla
    TypeOrmModule.forFeature([Booking]),
    
    // 2. Importamos ToursModule para poder inyectar ToursService en BookingsService
    ToursModule, 
  ],
  controllers: [BookingsController],
  providers: [BookingsService],
})
export class BookingsModule {}
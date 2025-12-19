import { Controller, Post, Body, UseGuards, Req, Get } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { AuthGuard } from '@nestjs/passport'; // El guardia de seguridad

@Controller('bookings')
@UseGuards(AuthGuard('jwt')) // <--- ¡CANDADO PUESTO! Solo usuarios con Token
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  create(@Body() createBookingDto: CreateBookingDto, @Req() req: any) {
    // req.user viene del Token JWT (lo inyectó el JwtStrategy)
    return this.bookingsService.create(createBookingDto, req.user);
  }

  @Get('my-bookings')
  findMyBookings(@Req() req: any) {
    return this.bookingsService.findMyBookings(req.user.id);
  }
}
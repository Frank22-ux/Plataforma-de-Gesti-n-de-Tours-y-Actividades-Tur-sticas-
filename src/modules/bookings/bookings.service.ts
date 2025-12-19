import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm'; // Importar DataSource
import { Booking, BookingStatus } from './entities/booking.entity';
import { CreateBookingDto } from './dto/create-booking.dto';
import { User } from '../auth/entities/user.entity';
import { Tour } from '../tours/entities/tour.entity';

@Injectable()
export class BookingsService {
  constructor(
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
    private readonly dataSource: DataSource, // Inyectamos la conexión global
  ) {}

  async create(createBookingDto: CreateBookingDto, user: User) {
    const { tourId, bookingDate, peopleCount } = createBookingDto;

    // INICIAMOS LA TRANSACCIÓN (ACID)
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Buscamos el tour dentro de la transacción (bloqueo pesimista opcional, aquí simple)
      const tour = await queryRunner.manager.findOne(Tour, { 
        where: { id: tourId } 
      });

      if (!tour) {
        throw new NotFoundException('El tour no existe');
      }

      // 2. Validar Stock (Si no es ilimitado y no alcanza)
      // Nota: stock -1 significa ilimitado
      if (tour.stock !== -1) {
        if (tour.stock < peopleCount) {
          throw new BadRequestException(`Solo quedan ${tour.stock} cupos disponibles.`);
        }
        
        // 3. Restar Stock
        tour.stock -= peopleCount;
        await queryRunner.manager.save(tour); // Guardamos el nuevo stock
      }

      // 4. Calcular Precio
      const totalPrice = Number(tour.price) * peopleCount;

      // 5. Crear la Reserva
      const booking = queryRunner.manager.create(Booking, {
        user,
        tour,
        bookingDate,
        peopleCount,
        totalPrice,
        status: BookingStatus.PENDING,
      });

      const savedBooking = await queryRunner.manager.save(booking);

      // 6. CONFIRMAR TODO (COMMIT)
      await queryRunner.commitTransaction();

      return savedBooking;

    } catch (err) {
      // SI ALGO FALLA, DESHACER CAMBIOS (ROLLBACK)
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      // LIBERAR CONEXIÓN
      await queryRunner.release();
    }
  }

  async findMyBookings(userId: string) {
    return this.bookingRepository.find({
      where: { userId },
      relations: ['tour'],
      order: { createdAt: 'DESC' }
    });
  }
}
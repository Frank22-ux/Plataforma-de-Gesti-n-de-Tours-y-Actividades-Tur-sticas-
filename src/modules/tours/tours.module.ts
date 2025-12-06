import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ToursService } from './tours.service';
import { ToursController } from './tours.controller';
import { Tour } from './entities/tour.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Tour])],
  controllers: [ToursController],
  providers: [ToursService],
})
export class ToursModule {}

import { Module } from '@nestjs/common';
import { PricingService } from './pricing.service';
import { PricingController } from './pricing.controller';
import { ToursModule } from '../tours/tours.module';

@Module({
  imports: [ToursModule],
  controllers: [PricingController],
  providers: [PricingService],
})
export class PricingModule {}

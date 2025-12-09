import { Injectable, NotFoundException } from '@nestjs/common';
import { ToursService } from '../tours/tours.service';
import { CalculatePriceDto } from './dto/calculate-price.dto';

@Injectable()
export class PricingService {
  constructor(
    // Inyectamos el servicio de Tours para consultar el precio base
    private readonly toursService: ToursService,
  ) {}

  async calculatePrice(dto: CalculatePriceDto) {
    // 1. Obtener el Tour de la base de datos (Precio Base)
    const tour = await this.toursService.findOne(dto.tourId);
    
    if (!tour) {
      throw new NotFoundException(`Tour con ID ${dto.tourId} no encontrado`);
    }

    // Convertimos el precio a número (por si viene como string de la DB)
    const basePrice = Number(tour.price);
    
    // 2. Calcular anticipación (Diferencia de días entre HOY y la FECHA DEL TOUR)
    const today = new Date();
    const targetDate = new Date(dto.bookingDate);
    
    // Matemáticas de fechas: (Futuro - Hoy) en milisegundos / milisegundos por día
    const diffTime = targetDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    let finalPrice = basePrice;
    let appliedRule = 'Tarifa Estándar';

    // --- REGLAS DE NEGOCIO (SMART PRICING) ---

    // REGLA 1: Early Bird (> 30 días) = 10% Descuento
    if (diffDays > 30) {
      finalPrice = basePrice * 0.90;
      appliedRule = 'Descuento Early Bird (10%)';
    } 
    // REGLA 2: Last Minute (< 7 días) = 15% Recargo
    else if (diffDays >= 0 && diffDays < 7) {
      finalPrice = basePrice * 1.15;
      appliedRule = 'Recargo Last Minute (15%)';
    }

    // 3. Retornar desglose
    return {
      tourId: tour.id,
      tourTitle: tour.title,
      basePrice: basePrice,
      bookingDate: dto.bookingDate,
      daysInAdvance: diffDays,
      appliedRule: appliedRule,
      finalPrice: Number(finalPrice.toFixed(2)), // Redondeamos a 2 decimales
    };
  }
}
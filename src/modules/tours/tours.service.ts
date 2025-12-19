import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { CreateTourDto } from './dto/create-tour.dto';
import { UpdateTourDto } from './dto/update-tour.dto';
import { Tour } from './entities/tour.entity';

@Injectable()
export class ToursService {
  constructor(
    @InjectRepository(Tour)
    private readonly tourRepository: Repository<Tour>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  private async clearCache() {
    const manager = this.cacheManager as any;
    const store = manager.store;
    if (store && store.reset) await store.reset();
    else if (manager.reset) await manager.reset();
  }

  async create(createTourDto: CreateTourDto) {
    await this.clearCache();
    const tour = this.tourRepository.create(createTourDto);
    return await this.tourRepository.save(tour);
  }

  async findNearby(lat: number, lon: number, radiusInKm: number) {
    const radiusInMeters = radiusInKm * 1000;
    return this.tourRepository
      .createQueryBuilder('tour')
      .setParameters({ lon, lat, range: radiusInMeters })
      .where(`ST_DWithin(tour.location, ST_SetSRID(ST_MakePoint(:lon, :lat), 4326), :range)`)
      .orderBy(`ST_Distance(tour.location, ST_SetSRID(ST_MakePoint(:lon, :lat), 4326))`, 'ASC')
      .getMany();
  }

  // --- CORRECCIÓN AQUÍ ---
  async findAll() {
    // Si usabas query builder o cache, asegúrate de que esto sea simple
    return this.tourRepository.find({
      order: { createdAt: 'DESC' }, // Ordenar por más recientes
      // Esto asegura que traiga todos los campos definidos en la entidad
    });
  }

  async findOne(id: string) {
    return this.tourRepository.findOneBy({ id });
  }

  async update(id: string, updateTourDto: UpdateTourDto) {
    await this.clearCache();
    // Corregido: Usamos 'as any' para evitar el conflicto de tipos con 'location'
    await this.tourRepository.update(id, updateTourDto as any);
    return this.findOne(id);
  }

  async remove(id: string) {
    await this.clearCache();
    return this.tourRepository.delete(id);
  }
}
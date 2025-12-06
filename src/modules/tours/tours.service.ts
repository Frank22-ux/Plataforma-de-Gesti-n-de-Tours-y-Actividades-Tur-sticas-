import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager'; // Seguimos usando 'import type'
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

  // --- HELPER PARA LIMPIAR CACHÉ (CORREGIDO) ---
  private async clearCache() {
    // TRUCO TÉCNICO: Convertimos 'cacheManager' a 'any' PRIMERO.
    // Así TypeScript deja de buscar la propiedad 'store' en la interfaz estricta.
    const manager = this.cacheManager as any;
    const store = manager.store;

    if (store && store.reset) {
      await store.reset(); // Intento 1: Reset directo
    } else if (store && store.keys && store.del) {
      // Intento 2: Borrado manual por llaves (Fallback para Redis)
      const keys = await store.keys('*');
      if (keys.length > 0) {
        await store.del(keys);
      }
    } else if (manager.reset) {
        await manager.reset(); // Intento 3: Reset en el manager
    }
  }

  async create(createTourDto: CreateTourDto) {
    await this.clearCache(); // Limpiamos caché antes de guardar
    
    const tour = this.tourRepository.create(createTourDto);
    return await this.tourRepository.save(tour);
  }

  async findNearby(lat: number, lon: number, radiusInKm: number) {
    const radiusInMeters = radiusInKm * 1000;

    return this.tourRepository
      .createQueryBuilder('tour')
      .setParameters({ 
        lon: lon, 
        lat: lat, 
        range: radiusInMeters 
      })
      .where(
        `ST_DWithin(
          tour.location, 
          ST_SetSRID(ST_MakePoint(:lon, :lat), 4326), 
          :range
        )`
      )
      .orderBy(
        `ST_Distance(
          tour.location, 
          ST_SetSRID(ST_MakePoint(:lon, :lat), 4326)
        )`, 
        'ASC'
      )
      .getMany();
  }

  findAll() {
    return this.tourRepository.find();
  }

  findOne(id: string) {
    return this.tourRepository.findOneBy({ id });
  }

  async update(id: string, updateTourDto: UpdateTourDto) {
    await this.clearCache(); // Limpiamos caché al editar
    return `This action updates a #${id} tour`;
  }

  async remove(id: string) {
    await this.clearCache(); // Limpiamos caché al borrar
    return `This action removes a #${id} tour`;
  }
}
import { Inject, Injectable, NotFoundException } from '@nestjs/common'; // <--- Agregado NotFoundException
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { CreateTourDto } from '../pricing/dto/create-tour.dto'; // <--- CORREGIDO: Apunta a la carpeta local ./dto
import { UpdateTourDto } from '../pricing/dto/update-tour.dto'; // <--- CORREGIDO: Apunta a la carpeta local ./dto
import { Tour } from './entities/tour.entity';

@Injectable()
export class ToursService {
  constructor(
    @InjectRepository(Tour)
    private readonly tourRepository: Repository<Tour>,
    
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  // --- HELPER PARA LIMPIAR CACHÉ ---
  private async clearCache() {
    const manager = this.cacheManager as any;
    const store = manager.store;

    if (store && store.reset) {
      await store.reset();
    } else if (store && store.keys && store.del) {
      const keys = await store.keys('*');
      if (keys.length > 0) {
        await store.del(keys);
      }
    } else if (manager.reset) {
        await manager.reset();
    }
  }

  // --- CREAR (REAL) ---
  async create(createTourDto: CreateTourDto) {
    await this.clearCache(); // Limpiar caché
    
    const tour = this.tourRepository.create(createTourDto);
    return await this.tourRepository.save(tour);
  }

  // --- BUSCAR CERCANOS (REAL) ---
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

  // --- ACTUALIZAR (REAL - AHORA SÍ GUARDA EN DB) ---
  async update(id: string, updateTourDto: UpdateTourDto) {
    await this.clearCache(); // 1. Limpiamos memoria

    // 2. 'preload' busca el ID y le "parchea" los datos nuevos
    const tour = await this.tourRepository.preload({
      id: id,
      ...updateTourDto,
    });

    if (!tour) {
      throw new NotFoundException(`Tour con ID ${id} no encontrado`);
    }

    // 3. Guardamos los cambios
    return await this.tourRepository.save(tour);
  }

  // --- ELIMINAR (REAL - AHORA SÍ BORRA DE LA DB) ---
  async remove(id: string) {
    await this.clearCache(); // 1. Limpiamos memoria

    // 2. Buscamos el tour primero para ver si existe
    const tour = await this.findOne(id); 
    
    if (!tour) {
      throw new NotFoundException(`Tour con ID ${id} no encontrado`);
    }

    // 3. Lo eliminamos físicamente
    return await this.tourRepository.remove(tour);
  }
}
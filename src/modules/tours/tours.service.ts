import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, Not } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { Cron, CronExpression } from '@nestjs/schedule'; // Necesario para la limpieza automática
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
    // 1. Limpieza de prototipos (FormData fix)
    const cleanData = { ...createTourDto };
    const tour = this.tourRepository.create(cleanData);
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

  async findAll() {
    // Solo devuelve los activos (donde deletedAt es null)
    return this.tourRepository.find({ order: { createdAt: 'DESC' } });
  }

  // --- NUEVO: VER PAPELERA DE RECICLAJE ---
  async findArchived() {
    return this.tourRepository.find({
      withDeleted: true, // Incluye los eliminados lógicamente
      where: { deletedAt: Not(IsNull()) }, // Filtra SOLO los que tienen fecha de borrado
      order: { deletedAt: 'DESC' }
    });
  }

  async findOne(id: string) {
    return this.tourRepository.findOneBy({ id });
  }

  async update(id: string, updateTourDto: UpdateTourDto) {
    await this.clearCache();
    // Cast 'as any' para evitar conflictos de tipado con location
    await this.tourRepository.update(id, updateTourDto as any);
    return this.findOne(id);
  }

  // --- BORRADO LÓGICO (MANDAR A PAPELERA) ---
  async remove(id: string) {
    await this.clearCache();
    
    // softDelete pone la fecha actual en 'deletedAt'.
    // El registro sigue en la DB, manteniendo la integridad de las reservas.
    const result = await this.tourRepository.softDelete(id);

    if (result.affected === 0) {
      throw new NotFoundException(`Tour con ID ${id} no encontrado`);
    }

    return { message: 'Tour enviado a la papelera (Archivado)' };
  }

  // --- NUEVO: RESTAURAR DE PAPELERA ---
  async restore(id: string) {
    await this.clearCache();
    const result = await this.tourRepository.restore(id); // Quita la fecha de deletedAt
    
    if (result.affected === 0) {
       throw new NotFoundException(`No se pudo restaurar el tour ${id}`);
    }
    return { message: 'Tour restaurado exitosamente' };
  }

  // --- NUEVO: LIMPIEZA AUTOMÁTICA (CRON JOB) ---
  // Se ejecuta todos los días a medianoche
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async cleanupOldTours() {
    console.log('🧹 Iniciando limpieza automática de tours caducados...');
    
    // Calcular fecha hace 3 meses
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    // Borrado Físico Definitivo (Hard Delete) de lo que lleve > 3 meses en papelera
    const result = await this.tourRepository
      .createQueryBuilder()
      .delete()
      .from(Tour)
      .where("deletedAt < :date", { date: threeMonthsAgo })
      .execute();

    if (result.affected && result.affected > 0) {
      console.log(`🗑️ Se eliminaron permanentemente ${result.affected} tours antiguos.`);
    }
  }
}
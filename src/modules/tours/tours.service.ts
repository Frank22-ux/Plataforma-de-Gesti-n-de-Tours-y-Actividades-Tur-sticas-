import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateTourDto } from './dto/create-tour.dto';
import { UpdateTourDto } from './dto/update-tour.dto';
import { Tour } from './entities/tour.entity';

@Injectable()
export class ToursService {
  constructor(
    @InjectRepository(Tour)
    private readonly tourRepository: Repository<Tour>,
  ) {}

  async create(createTourDto: CreateTourDto) {
    // Creamos la instancia
    const tour = this.tourRepository.create(createTourDto);
    // Guardamos en DB (PostGIS procesará automáticamente el location)
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

  findOne(id: number) {
    return `This action returns a #${id} tour`;
  }

  update(id: number, updateTourDto: UpdateTourDto) {
    return `This action updates a #${id} tour`;
  }

  remove(id: number) {
    return `This action removes a #${id} tour`;
  }
}
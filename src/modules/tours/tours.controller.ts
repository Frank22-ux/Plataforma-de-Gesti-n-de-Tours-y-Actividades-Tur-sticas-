import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  Query, 
  ParseFloatPipe,
  UseInterceptors
} from '@nestjs/common';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
import { ToursService } from './tours.service';
import { CreateTourDto } from './dto/create-tour.dto';
import { UpdateTourDto } from './dto/update-tour.dto';

@Controller('tours')
export class ToursController {
  constructor(private readonly toursService: ToursService) {}

  @Post()
  create(@Body() createTourDto: CreateTourDto) {
    return this.toursService.create(createTourDto);
  }

  // --- OPTIMIZACIÓN CON REDIS ---
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(30) // Guarda en caché por 30 segundos
  @Get('nearby')
  findNearby(
    @Query('lat', ParseFloatPipe) lat: number,
    @Query('lon', ParseFloatPipe) lon: number,
    @Query('km', ParseFloatPipe) km: number,
  ) {
    return this.toursService.findNearby(lat, lon, km);
  }

  @Get()
  findAll() {
    return this.toursService.findAll();
  }
  
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.toursService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTourDto: UpdateTourDto) {
    // CORREGIDO: Se quitó el '+' antes de id
    return this.toursService.update(id, updateTourDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    // CORREGIDO: Se quitó el '+' antes de id
    return this.toursService.remove(id);
  }
}
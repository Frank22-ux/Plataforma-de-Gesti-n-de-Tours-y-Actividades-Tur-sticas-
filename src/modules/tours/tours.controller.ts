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
  UseInterceptors,
  UseGuards,
  UploadedFiles
} from '@nestjs/common';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
import { AuthGuard } from '@nestjs/passport'; // Seguridad
import { FilesInterceptor } from '@nestjs/platform-express'; // Subida de archivos
import { diskStorage } from 'multer'; // Motor de almacenamiento
import { extname } from 'path'; // Para obtener la extensión (.jpg, .png)

import { ToursService } from './tours.service';
import { CreateTourDto } from './dto/create-tour.dto';
import { UpdateTourDto } from './dto/update-tour.dto';

@Controller('tours')
export class ToursController {
  constructor(private readonly toursService: ToursService) {}

  // --- CREAR TOUR CON IMÁGENES ---
  @Post()
  @UseGuards(AuthGuard('jwt')) // 1. Solo usuarios logueados
  @UseInterceptors(FilesInterceptor('images', 3, { // 2. Intercepta campo 'images', máx 3 fotos
    storage: diskStorage({
      destination: './uploads', // Carpeta destino
      filename: (req, file, callback) => {
        // Generamos un nombre único: tour-123456789.jpg
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = extname(file.originalname);
        callback(null, `tour-${uniqueSuffix}${ext}`);
      },
    }),
  }))
  create(
    @UploadedFiles() files: Array<Express.Multer.File>, // Recibimos los archivos
    @Body() createTourDto: any // Usamos 'any' porque FormData envía todo como texto
  ) {
    // 🔍 DEBUG: Ver qué llega exactamente desde el Frontend
    console.log('📦 Datos recibidos del formulario:', createTourDto);

    // 3. Procesamos los datos (Parsing y Mapeo Explícito)
    const tourData = {
      ...createTourDto,
      price: parseFloat(createTourDto.price), // "100.50" -> 100.50
      
      // Mapeo explícito de campos nuevos para asegurar que pasen
      category: createTourDto.category || 'General',
      stock: createTourDto.stock ? parseInt(createTourDto.stock, 10) : -1,

      location: typeof createTourDto.location === 'string' 
        ? JSON.parse(createTourDto.location) 
        : createTourDto.location,
      
      images: files ? files.map(f => f.filename) : [],
    };

    return this.toursService.create(tourData);
  }

  // --- OPTIMIZACIÓN CON REDIS (Cero Latencia) ---
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
    return this.toursService.update(id, updateTourDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.toursService.remove(id);
  }
}
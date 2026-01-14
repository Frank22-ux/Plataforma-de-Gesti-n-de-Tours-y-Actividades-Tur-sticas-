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
import { AuthGuard } from '@nestjs/passport'; 
import { FilesInterceptor } from '@nestjs/platform-express'; 
import { diskStorage } from 'multer'; 
import { extname } from 'path'; 

import { ToursService } from './tours.service';
import { CreateTourDto } from './dto/create-tour.dto';
import { UpdateTourDto } from './dto/update-tour.dto';

// Configuración de almacenamiento reutilizable para Multer (Carpeta uploads)
const storageConfig = diskStorage({
  destination: './uploads', 
  filename: (req, file, callback) => {
    // Generar nombre único: tour-TIMESTAMP-RANDOM.ext
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = extname(file.originalname);
    callback(null, `tour-${uniqueSuffix}${ext}`);
  },
});

// Helper para parsear booleanos que vienen como string "true"/"false" en FormData
const parseBool = (value: any) => value === 'true' || value === true;

@Controller('tours')
export class ToursController {
  constructor(private readonly toursService: ToursService) {}

  // --- CREAR (POST) ---
  @Post()
  @UseGuards(AuthGuard('jwt')) 
  @UseInterceptors(FilesInterceptor('images', 15, { storage: storageConfig })) // Máx 15 fotos
  create(
    @UploadedFiles() files: Array<Express.Multer.File>, 
    @Body() dto: any // Usamos 'any' porque FormData envía todo como string
  ) {
    console.log('📦 CREANDO TOUR:', dto);
    
    // Parseo manual de datos complejos (JSON strings)
    let parsedGuides = [];
    try {
        // Si guideIds viene como string "['id1', 'id2']"
        parsedGuides = JSON.parse(dto.guideIds || '[]');
    } catch(e) { 
        // Si viene como string simple o falla el parseo
        parsedGuides = dto.guideIds ? [dto.guideIds] : []; 
    }

    const tourData = {
      ...dto,
      price: parseFloat(dto.price), 
      category: dto.category || 'General',
      // Convertir stock a entero (o -1 si es ilimitado)
      stock: dto.stock ? parseInt(dto.stock, 10) : -1,
      
      // Parsear ubicación
      location: typeof dto.location === 'string' 
        ? JSON.parse(dto.location) 
        : dto.location,
      
      // Nuevos campos parseados
      guideIds: parsedGuides,
      isAdultOnly: parseBool(dto.isAdultOnly),
      
      // Datos de Hospedaje
      hasLodging: parseBool(dto.hasLodging),
      lodgingDays: dto.lodgingDays ? parseInt(dto.lodgingDays) : 0,
      lodgingNights: dto.lodgingNights ? parseInt(dto.lodgingNights) : 0,
      lodgingRooms: dto.lodgingRooms ? parseInt(dto.lodgingRooms) : 0,
      hasTransport: parseBool(dto.hasTransport),
      hasFood: parseBool(dto.hasFood),
      
      // En creación, solo hay imágenes nuevas
      images: files ? files.map(f => f.filename) : [], 
    };

    return this.toursService.create(tourData);
  }

  // --- EDITAR (PATCH) - LOGICA MEJORADA ---
  @Patch(':id')
  @UseGuards(AuthGuard('jwt')) 
  @UseInterceptors(FilesInterceptor('images', 15, { storage: storageConfig })) 
  update(
    @Param('id') id: string, 
    @UploadedFiles() files: Array<Express.Multer.File>,
    @Body() dto: any 
  ) {
    console.log(`📝 EDITANDO TOUR ${id}:`, dto);

    // 1. Copiamos los datos base
    const tourData = { ...dto };

    // 2. Conversiones de Tipos (String -> Number/JSON/Boolean)
    if (tourData.price) tourData.price = parseFloat(tourData.price);
    if (tourData.stock) tourData.stock = parseInt(tourData.stock, 10);
    
    // Parseo de Ubicación
    if (tourData.location && typeof tourData.location === 'string') {
      try {
        tourData.location = JSON.parse(tourData.location);
      } catch (e) {
        console.error("Error parseando location en update", e);
      }
    }

    // Parseo de Guías
    if (tourData.guideIds && typeof tourData.guideIds === 'string') {
        try { tourData.guideIds = JSON.parse(tourData.guideIds); } 
        catch(e) { tourData.guideIds = [tourData.guideIds]; }
    }

    // Parseo de Booleanos y Enteros extra
    if (tourData.isAdultOnly !== undefined) tourData.isAdultOnly = parseBool(tourData.isAdultOnly);
    if (tourData.hasLodging !== undefined) tourData.hasLodging = parseBool(tourData.hasLodging);
    if (tourData.hasTransport !== undefined) tourData.hasTransport = parseBool(tourData.hasTransport);
    if (tourData.hasFood !== undefined) tourData.hasFood = parseBool(tourData.hasFood);
    
    if (tourData.lodgingDays) tourData.lodgingDays = parseInt(tourData.lodgingDays);
    if (tourData.lodgingNights) tourData.lodgingNights = parseInt(tourData.lodgingNights);
    if (tourData.lodgingRooms) tourData.lodgingRooms = parseInt(tourData.lodgingRooms);

    // 3. GESTIÓN DE IMÁGENES (Fusión de Viejas + Nuevas)
    
    // a) Obtener imágenes existentes que se quieren conservar
    let existingImages: string[] = [];
    if (tourData.existingImages) {
      if (typeof tourData.existingImages === 'string') {
        try {
          const parsed = JSON.parse(tourData.existingImages);
          existingImages = Array.isArray(parsed) ? parsed : [tourData.existingImages];
        } catch {
          existingImages = [tourData.existingImages];
        }
      } else if (Array.isArray(tourData.existingImages)) {
        existingImages = tourData.existingImages;
      }
    }

    // b) Obtener nombres de las NUEVAS imágenes subidas
    const newImages = files ? files.map(f => f.filename) : [];

    // c) Combinar ambas listas
    // Si hay nuevas imágenes O si se enviaron imágenes existentes (significa que se tocó la galería)
    if (newImages.length > 0 || tourData.existingImages !== undefined) {
        tourData.images = [...existingImages, ...newImages];
    } else {
        // Si no se envió nada relacionado con imágenes, no tocamos la columna (mantiene lo que había en DB)
        delete tourData.images; 
    }
    
    // Limpiamos propiedad auxiliar
    delete tourData.existingImages;

    return this.toursService.update(id, tourData);
  }

  // --- RESTO DE MÉTODOS (GET, DELETE) ---

  @UseInterceptors(CacheInterceptor)
  @CacheTTL(30)
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

  @Delete(':id')
  @UseGuards(AuthGuard('jwt')) 
  remove(@Param('id') id: string) {
    return this.toursService.remove(id);
  }

  // Métodos de Papelera
  @Get('archived')
  @UseGuards(AuthGuard('jwt'))
  findArchived() {
    return this.toursService.findArchived();
  }

  @Patch(':id/restore')
  @UseGuards(AuthGuard('jwt'))
  restore(@Param('id') id: string) {
    return this.toursService.restore(id);
  }
}
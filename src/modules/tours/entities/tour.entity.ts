import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('tours') // Nombre de la tabla en DB
export class Tour {
  @PrimaryGeneratedColumn('uuid') // Usamos UUIDs, son más seguros que IDs numéricos (1, 2, 3)
  id: string;

  @Column('text')
  title: string;

  @Column('text')
  description: string;

  @Column('decimal', { precision: 10, scale: 2 }) // Ejemplo: 150.00
  price: number;

  // --- AQUÍ ESTÁ LA MAGIA DE POSTGIS ---
  @Column({
    type: 'geography', // 'geography' calcula distancias en metros reales (curvatura de la tierra)
    spatialFeatureType: 'Point', 
    srid: 4326, // Estándar GPS mundial (WGS 84)
  })
  location: any; // Guardaremos un objeto GeoJSON { type: 'Point', coordinates: [lon, lat] }

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
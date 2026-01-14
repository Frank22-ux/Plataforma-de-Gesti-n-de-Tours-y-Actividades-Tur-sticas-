import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, DeleteDateColumn } from 'typeorm';

@Entity('tours')
export class Tour {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text')
  title: string;

  @Column('text')
  description: string;

  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'text', nullable: true, default: 'General' }) 
  category: string;

  @Column('int', { default: -1 })
  stock: number; // -1 = Ilimitado

  // --- NUEVOS CAMPOS (SPRINT 5) ---

  // 1. Fechas
  @Column({ type: 'date', nullable: true })
  startDate: string;

  @Column({ type: 'date', nullable: true })
  endDate: string;

  // 2. Múltiples Guías (Guardamos IDs como array de texto simple por ahora)
  @Column('text', { array: true, default: [] })
  guideIds: string[];

  // 3. Restricciones
  @Column({ default: false })
  isAdultOnly: boolean;

  // 4. Hospedaje y Servicios
  @Column({ default: false })
  hasLodging: boolean;

  @Column('int', { default: 0 })
  lodgingDays: number;

  @Column('int', { default: 0 })
  lodgingNights: number;
  
  @Column('int', { default: 0 })
  lodgingRooms: number;

  @Column({ default: false })
  hasTransport: boolean;

  @Column({ type: 'text', nullable: true })
  transportType: string; // 'roundtrip', 'pickup', etc.

  @Column({ default: false })
  hasFood: boolean;

  // -------------------------------

  @Column({
    type: 'geography',
    spatialFeatureType: 'Point', 
    srid: 4326, 
  })
  location: any;

  @Column('text', { array: true, default: [] })
  images: string[];

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn() 
  deletedAt: Date;
}
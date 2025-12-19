import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

// Definimos los roles posibles para evitar errores de escritura
export enum UserRole {
  ADMIN = 'admin',
  GUIDE = 'guide',
  TRAVELER = 'traveler',
}

@Entity('users') // Nombre de la tabla en PostgreSQL
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column() 
  name: string;

  @Column({ unique: true }) // El email no puede repetirse
  email: string;

  @Column()
  password: string; // Aquí guardaremos el HASH (encriptada), no el texto plano

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.TRAVELER, // Si no se especifica, será viajero por defecto
  })
  role: UserRole;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
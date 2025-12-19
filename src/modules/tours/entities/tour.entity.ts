import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('tours')
export class Tour {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ default: true })
  isActive: boolean;

  @Column()
  title: string;

  @Column('text')
  description: string;

  @Column('decimal')
  price: number;

  // 🔥 ESTAS 3 SON LAS QUE FALTAN
  @Column({ nullable: true })
  category: string;

  @Column({ type: 'int', nullable: true })
  stock: number;

  @Column({ default: false })
  isUnlimited: boolean;

  @Column('text', { array: true, nullable: true })
  images: string[];

  @Column({
    type: 'geometry',
    spatialFeatureType: 'Point',
    srid: 4326,
  })
  location: any;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

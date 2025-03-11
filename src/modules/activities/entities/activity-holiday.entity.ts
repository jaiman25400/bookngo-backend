import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Activity } from './activity.entity';

@Entity('activity_holidays')
export class ActivityHoliday {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'date' })
  date: Date;

  @ManyToOne(() => Activity, (activity) => activity.holidays, {
    onDelete: 'CASCADE', // Ensures that when an Activity is deleted, related holidays are deleted as well
  })
  activity: Activity;
}
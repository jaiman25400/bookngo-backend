import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Activity } from './activity.entity';

@Entity('activity_schedules')
export class ActivitySchedule {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  day: string;

  @Column({ type: 'time', nullable: true })
  start_time: string;

  @Column({ type: 'time', nullable: true })
  end_time: string;

  @Column({ default: false })
  is_24hours: boolean;

  @Column({ default: false })
  is_holiday: boolean;

  @ManyToOne(() => Activity, (activity) => activity.schedules, {
    onDelete: 'CASCADE',
  })
  activity: Activity;
}

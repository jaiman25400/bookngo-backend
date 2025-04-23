import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Activity } from './activity.entity';
import { Exclude } from 'class-transformer';

@Entity({name:'activity_schedules', schema :'BookNGo_CMS'})
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

  @Exclude() // Add this decorator
  @ManyToOne(() => Activity, (activity) => activity.schedules, {
    onDelete: 'CASCADE',
  })
  activity: Activity;
}

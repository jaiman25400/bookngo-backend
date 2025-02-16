import { 
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn 
} from 'typeorm';
import { Customer } from '../customers/customers.entity';

@Entity('customer_users')
export class CustomerUser {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Customer, (customer) => customer.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;  // Links to the business (customer)

  @Column({ unique: true })
  email: string;  // User login email

  @Column({ nullable: true })  // Initially null, will be set when user creates a password
  password: string;

  @Column('enum', { enum: ['Manager', 'Admin','Team'], default: 'Team' })
  role: string;  // Defines user roles in the business

  @Column({ default: false }) // User is inactive until password is set
  is_active: boolean;

  @Column({ default: false }) // User is inactive until password is set
  name: string;

  @Column({ type: 'text', nullable: true })
  password_token?: string | null;
  
  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

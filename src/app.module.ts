import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { databaseConfig } from './config/database';
import { CustomersModule } from './modules/customers/customers.module';
import { CustomerUsersModule } from './modules/customer-users/customer-users.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { AuthModule } from './modules/auth/auth.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ActivitiesModule } from './modules/activities/activities.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // ✅ Makes ConfigModule available across all modules
    }),
    TypeOrmModule.forRoot(databaseConfig), // ✅ Load DB config
    CustomersModule,
    AuthModule,
    CustomerUsersModule,
    InventoryModule,
    ActivitiesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

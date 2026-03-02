import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { databaseConfig } from './config/database';
import { CustomersModule } from './modules/cms/customers/customers.module';
import { InventoryModule } from './modules/cms/inventory/inventory.module';
import { CustomerUsersModule } from './modules/cms/customer-users/customer-users.module';
import { AuthModule } from './modules/cms/auth/auth.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ActivitiesModule } from './modules/cms/activities/activities.module';
import { ActivityZonesModule } from './modules/cms/activity-zones/activity-zones.module';
import { SkiSlopesModule } from './modules/user/ski-slopes/ski-slopes.module';
import { OnboardingModule } from './modules/user/onboarding/onboarding.module';
import { VendorsModule } from './modules/user/vendors/vendors.module';
import { BookingsModule } from './modules/user/bookings/bookings.module';
import { DashboardModule } from './modules/cms/dashboard/dashboard.module';
import { CmsBookingsModule } from './modules/cms/bookings/bookings.module';

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
    ActivityZonesModule,
    SkiSlopesModule,
    OnboardingModule,
    VendorsModule,
    BookingsModule,
    DashboardModule,
    CmsBookingsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

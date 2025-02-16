import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { databaseConfig } from './config/database';
import { CustomersModule } from './modules/customers/customers.module';
import { CustomerUsersModule } from './modules/customer-users/customer-users.module';
import { AuthModule } from './modules/auth/auth.module';


@Module({
  imports: [TypeOrmModule.forRoot(databaseConfig), CustomersModule,AuthModule,CustomerUsersModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

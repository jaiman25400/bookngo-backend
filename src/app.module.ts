import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { databaseConfig } from './config/database';
import { CustomersModule } from './modules/customers/customers.module';

@Module({
  imports: [TypeOrmModule.forRoot(databaseConfig), CustomersModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

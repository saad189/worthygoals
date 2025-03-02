import { Module, ValidationPipe } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { EntitySchema } from 'typeorm';
import { CustomConfigModule, TypeOrmDatabaseModule } from './config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_PIPE } from '@nestjs/core';
import { CoreModule } from './core';

const modules = [];
const entities = [__dirname + '/**/*.entity{.ts,.js}'] as unknown as EntitySchema[];
@Module({
  imports: [
    CustomConfigModule, TypeOrmDatabaseModule,
    ...modules,
    TypeOrmModule.forFeature(entities),
    CoreModule
  ],
  controllers: [AppController],
  providers: [AppService, {
    provide: APP_PIPE,
    useClass: ValidationPipe
  }],
})
export class AppModule { }

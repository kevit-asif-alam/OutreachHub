import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './modules/auth/auth.module';
import { AdminAuthController } from './modules/auth/admin-auth.controller';

@Module({
  imports: [
    MongooseModule.forRoot(
      process.env.MONGO_URI || 'mongodb://localhost/outreachhub',
    ),
    AuthModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}

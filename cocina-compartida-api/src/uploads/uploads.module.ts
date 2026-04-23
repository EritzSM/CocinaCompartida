import { Module } from '@nestjs/common';
import { UploadsController } from './uploads.controller';
import { SupabaseStorageService } from './supabase-storage.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [UploadsController],
  providers: [SupabaseStorageService],
  exports: [SupabaseStorageService],
})
export class UploadsModule {}

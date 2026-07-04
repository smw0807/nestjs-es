import { Module } from '@nestjs/common';
import { EsKitModule } from 'nestjs-es-kit';
import { Product } from './product.schema';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';

@Module({
  imports: [EsKitModule.forFeature([Product])],
  controllers: [ProductController],
  providers: [ProductService],
  exports: [ProductService],
})
export class ProductModule {}

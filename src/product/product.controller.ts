import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ProductService } from './product.service';
import {
  BulkCreateProductDto,
  CreateProductDto,
} from './dto/create-product.dto';
import {
  CursorSearchProductDto,
  SearchProductDto,
} from './dto/search-product.dto';

@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  create(@Body() dto: CreateProductDto) {
    return this.productService.create(dto);
  }

  @Post('bulk')
  bulkCreate(@Body() dto: BulkCreateProductDto) {
    return this.productService.bulkCreate(dto);
  }

  @Get('search')
  search(@Query() dto: SearchProductDto) {
    return this.productService.search(dto);
  }

  @Get('facets')
  facets(@Query() dto: SearchProductDto) {
    return this.productService.facets(dto);
  }

  @Get('cursor')
  cursorSearch(@Query() dto: CursorSearchProductDto) {
    return this.productService.cursorSearch(dto);
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.productService.findById(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productService.remove(id);
  }
}

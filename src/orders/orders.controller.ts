import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { AccessOrRefreshGuard } from '../auth/access-or-refresh.guard';
import {
  IsArray,
  IsNumber,
  IsString,
  Min,
  ValidateNested,
  IsEnum,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';

class OrderItemDto {
  @IsNumber()
  id: number;

  @IsString()
  title: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsNumber()
  @Min(1)
  quantity: number;
}

class CreateOrderRequestDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @IsString()
  phone: string;

  @IsEnum(['pickup', 'delivery'])
  deliveryType: 'pickup' | 'delivery';

  @IsOptional()
  @IsString()
  address?: string;
}

@Controller('orders')
@UseGuards(AccessOrRefreshGuard)
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  @Post('create-order')
  @HttpCode(HttpStatus.CREATED)
  async createOrder(
    @Body() createOrderDto: CreateOrderRequestDto,
    @Request() req,
  ) {
    console.log('req.user:', req.user);
    const userId = req.user.userId || req.user.id || req.user.sub;
    return this.ordersService.createOrder(userId, createOrderDto);
  }

  @Get('get-user-orders')
  @HttpCode(HttpStatus.OK)
  async getUserOrders(@Request() req) {
    const userId = req.user.userId || req.user.id || req.user.sub;
    return this.ordersService.getUserOrders(userId);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async getOrderById(
    @Param('id', ParseIntPipe) orderId: number,
    @Request() req,
  ) {
    const userId = req.user.userId || req.user.id || req.user.sub;
    return this.ordersService.getOrderById(orderId, userId);
  }
}

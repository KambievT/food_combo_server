import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { PaymentService } from './payment.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { IsNumber, IsString, Min, IsNotEmpty } from 'class-validator';

class CreatePaymentDto {
  @IsNumber()
  @Min(1)
  amount: number;

  @IsString()
  @IsNotEmpty()
  description: string;
}

@Controller('payment')
@UseGuards(JwtAuthGuard)
export class PaymentController {
  constructor(private paymentService: PaymentService) {}

  @Post('create')
  @HttpCode(HttpStatus.CREATED)
  async createPayment(@Body() paymentDto: CreatePaymentDto) {
    return this.paymentService.createPayment(
      paymentDto.amount,
      paymentDto.description,
    );
  }

  @Get('status/:paymentId')
  @HttpCode(HttpStatus.OK)
  async getPaymentStatus(@Param('paymentId') paymentId: string) {
    return this.paymentService.getPaymentStatus(paymentId);
  }
}

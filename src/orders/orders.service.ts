import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { PaymentService } from '../payment/payment.service';

export interface OrderItem {
  id: number;
  title: string;
  price: number;
  quantity: number;
}

export interface CreateOrderDto {
  items: OrderItem[];
  phone: string;
  deliveryType: 'pickup' | 'delivery';
  address?: string;
}

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private paymentService: PaymentService,
  ) {}

  async createOrder(userId: number, createOrderDto: CreateOrderDto) {
    const totalAmount = createOrderDto.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );

    const order = await this.prisma.order.create({
      data: {
        userId,
        items: createOrderDto.items,
        totalAmount,
        status: 'pending',
        phone: createOrderDto.phone,
        deliveryType: createOrderDto.deliveryType,
        address: createOrderDto.address,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Создаём платёж в ЮKassa
    const payment = await this.paymentService.createPayment(
      totalAmount,
      `Заказ #${order.id}`,
    );

    // Обновляем заказ с ID платежа
    const updatedOrder = await this.prisma.order.update({
      where: { id: order.id },
      data: { paymentId: payment.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return {
      order: updatedOrder,
      payment: {
        id: payment.id,
        confirmationUrl: payment.confirmation.confirmation_url,
      },
    };
  }

  async getUserOrders(userId: number) {
    return this.prisma.order.findMany({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getOrderById(orderId: number, userId: number) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  async updateOrderStatus(orderId: number, status: string) {
    return this.prisma.order.update({
      where: { id: orderId },
      data: { status },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }
}

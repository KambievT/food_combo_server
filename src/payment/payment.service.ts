import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class PaymentService {
  private readonly yookassaApiUrl = 'https://api.yookassa.ru/v3';
  private readonly shopId: string;
  private readonly secretKey: string;

  constructor(private configService: ConfigService) {
    this.shopId = this.configService.get<string>('YOOKASSA_SHOP_ID');
    this.secretKey = this.configService.get<string>('YOOKASSA_SECRET_KEY');
  }

  private getAuthHeader() {
    const auth = Buffer.from(`${this.shopId}:${this.secretKey}`).toString(
      'base64',
    );
    return `Basic ${auth}`;
  }

  async createPayment(amount: number, description: string) {
    try {
      const response = await axios.post(
        `${this.yookassaApiUrl}/payments`,
        {
          amount: {
            value: amount.toFixed(2),
            currency: 'RUB',
          },
          confirmation: {
            type: 'redirect',
            return_url: this.configService.get<string>('PAYMENT_RETURN_URL'),
          },
          capture: true,
          description,
        },
        {
          headers: {
            Authorization: this.getAuthHeader(),
            'Idempotence-Key': Date.now().toString(),
            'Content-Type': 'application/json',
          },
        },
      );

      return response.data;
    } catch (error) {
      throw new Error(`Failed to create payment: ${error.message}`);
    }
  }

  async getPaymentStatus(paymentId: string) {
    try {
      const response = await axios.get(
        `${this.yookassaApiUrl}/payments/${paymentId}`,
        {
          headers: {
            Authorization: this.getAuthHeader(),
            'Content-Type': 'application/json',
          },
        },
      );

      return response.data;
    } catch (error) {
      throw new Error(`Failed to get payment status: ${error.message}`);
    }
  }
}

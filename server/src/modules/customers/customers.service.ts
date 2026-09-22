import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../config/database/prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { Prisma } from '@prisma/client';
import { successRes } from '../../common/helper/success-response';

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(storeId: number, createCustomerDto: CreateCustomerDto) {
    const customer = await this.prisma.customer.create({
      data: {
        ...createCustomerDto,
        storeId,
      },
    });
    return successRes(customer, 201);
  }

  async findAll(storeId: number, search?: string) {
    const where: Prisma.CustomerWhereInput = { storeId };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }
    const customers = await this.prisma.customer.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    return successRes(customers);
  }

  async findOne(storeId: number, id: number) {
    const customer = await this.prisma.customer.findFirst({
      where: { id, storeId },
      include: {
        debts: {
          where: { isPaid: false, deletedAt: null },
        },
      },
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${id} not found`);
    }

    const totalDebt = customer.debts.reduce(
      (sum, debt) => sum + Number(debt.remainingAmount),
      0,
    );

    return successRes({
      ...customer,
      totalDebt,
    });
  }

  async update(
    storeId: number,
    id: number,
    updateCustomerDto: UpdateCustomerDto,
  ) {
    const customer = await this.prisma.customer.findFirst({
      where: { id, storeId },
    });
    if (!customer) {
      throw new NotFoundException(`Customer with ID ${id} not found`);
    }

    const updated = await this.prisma.customer.update({
      where: { id },
      data: updateCustomerDto,
    });
    return successRes(updated);
  }

  async remove(storeId: number, id: number) {
    const customer = await this.prisma.customer.findFirst({
      where: { id, storeId },
    });
    if (!customer) {
      throw new NotFoundException(`Customer with ID ${id} not found`);
    }

    const activeDebts = await this.prisma.debt.count({
      where: { customerId: id, isPaid: false, deletedAt: null },
    });
    if (activeDebts > 0) {
      throw new BadRequestException(
        "Mijozda to'lanmagan qarz mavjud, o'chirib bo'lmaydi",
      );
    }

    const salesCount = await this.prisma.sale.count({
      where: { customerId: id },
    });
    if (salesCount > 0) {
      throw new BadRequestException(
        "Mijozga bog'langan savdolar mavjud, o'chirib bo'lmaydi",
      );
    }

    await this.prisma.customer.delete({ where: { id } });
    return successRes({ message: "Mijoz o'chirildi", id });
  }
}

import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../config/database/prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { QueryCustomerDto } from './dto/query-customer.dto';
import { Prisma } from '@prisma/client';
import { successRes } from '../../common/helper/success-response';
import { pageParams, paginate } from '../../common/helper/paginate';

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

  async findAll(storeId: number, query?: QueryCustomerDto) {
    const { page, limit, skip, take } = pageParams(query);
    const where: Prisma.CustomerWhereInput = { storeId };
    if (query?.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { phone: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [total, items] = await Promise.all([
      this.prisma.customer.count({ where }),
      this.prisma.customer.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
    ]);
    return successRes(paginate(items, total, { page, limit }));
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

import { inject, injectable } from 'tsyringe';

import AppError from '@shared/errors/AppError';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICustomersRepository from '@modules/customers/repositories/ICustomersRepository';
import Order from '../infra/typeorm/entities/Order';
import IOrdersRepository from '../repositories/IOrdersRepository';

interface IProduct {
  id: string;
  quantity: number;
}

interface IRequest {
  customer_id: string;
  products: IProduct[];
}

@injectable()
class CreateOrderService {
  constructor(
    @inject('OrdersRepository')
    private ordersRepository: IOrdersRepository,
    @inject('ProductsRepository')
    private productsRepository: IProductsRepository,
    @inject('CustomersRepository')
    private customersRepository: ICustomersRepository,
  ) {}

  public async execute({ customer_id, products }: IRequest): Promise<Order> {
    const customer = await this.customersRepository.findById(customer_id);

    if (!customer) {
      throw new AppError('Cliente não encontrado');
    }

    products.map(p => console.log(p.id));

    const findAllProducts = await this.productsRepository.findAllById(products);
    console.log('findAllProducts.length', findAllProducts.length);
    console.log('products.length', products.length);
    if (findAllProducts.length !== products.length) {
      throw new AppError('Há produtos não cadastrados');
    }

    // TODO : Produtos foreach
    console.log(`Order products ${JSON.stringify(products)}`);

    const findProductsWithNoQuantityAvailable = products.filter(
      product =>
        findAllProducts.filter(p => p.id === product.id)[0].quantity <
        product.quantity,
    );

    if (findProductsWithNoQuantityAvailable.length) {
      throw new AppError(
        `Sem quantidade suficiente para os produtos ${findProductsWithNoQuantityAvailable[0].quantity} do id ${findProductsWithNoQuantityAvailable[0].id}`,
      );
    }

    const serializedProducts = products.map(product => ({
      product_id: product.id,
      quantity: product.quantity,
      price: findAllProducts.filter(p => p.id === product.id)[0].price,
    }));

    const order = await this.ordersRepository.create({
      customer,
      products: serializedProducts,
    });
    console.log(`Order ${JSON.stringify(order)}`);

    const { order_products } = order;

    const orderedProductsQuantity = order_products.map(product => ({
      id: product.product_id,
      quantity:
        findAllProducts.filter(p => p.id === product.product_id)[0].quantity -
        product.quantity,
    }));

    await this.productsRepository.updateQuantity(orderedProductsQuantity);

    return order;
  }
}

export default CreateOrderService;

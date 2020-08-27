import { getRepository, Repository, In, Equal } from 'typeorm';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICreateProductDTO from '@modules/products/dtos/ICreateProductDTO';
import IUpdateProductsQuantityDTO from '@modules/products/dtos/IUpdateProductsQuantityDTO';
import AppError from '@shared/errors/AppError';
import Product from '../entities/Product';

interface IFindProducts {
  id: string;
}

class ProductsRepository implements IProductsRepository {
  private ormRepository: Repository<Product>;

  constructor() {
    this.ormRepository = getRepository(Product);
  }

  public async create({
    name,
    price,
    quantity,
  }: ICreateProductDTO): Promise<Product> {
    const product = await this.ormRepository.create({
      name,
      price,
      quantity,
    });
    return product;
  }

  public async findByName(name: string): Promise<Product | undefined> {
    const product = await this.ormRepository.findOne({
      where: { name },
    });
    return product;
  }

  public async findAllById(products: IFindProducts[]): Promise<Product[]> {
    const product = await this.ormRepository.findByIds(products);
    return product;
  }

  public async updateQuantity(
    products: IUpdateProductsQuantityDTO[],
  ): Promise<Product[]> {
    products.forEach(async prod => {
      const findProd = await this.ormRepository.findOne(prod.id);
      if (!findProd) {
        throw new AppError('Produto não encontrado.');
      }
      findProd.quantity = prod.quantity;
      await this.ormRepository.save(findProd);
    });
    return this.ormRepository.findByIds(products);
  }
}

export default ProductsRepository;

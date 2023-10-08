import { Injectable } from '@nestjs/common';
import { ulid } from 'ulid';

import { IProductRepo } from '../../../DAL/index.js';
import { OrgService } from '../../org/services/org.service.js';

// Entity Types
import type {
  OrgID,
  UserID,
  Product,
  ProductID,
  Products,
  CreateOneProductDTO,
} from 'domain-model';

// Service layer Exceptions
import {
  NotFoundException,
  ForbiddenException,
} from '../../../exceptions/index.js';

@Injectable()
export class ProductService {
  constructor(
    private readonly productRepo: IProductRepo,
    private readonly orgService: OrgService,
  ) {}

  /**
   * Validate a product ID by checking if a product exists. Throws the common
   * `NotFoundException` if it does not exists.
   */
  async validateProductID(productID: ProductID): Promise<void> {
    if (!(await this.productRepo.productExists(productID)))
      throw new NotFoundException(
        `Product with ProductID '${productID}' does not exist.`,
      );
  }

  /**
   * Validate if a user have access permission to a product. Throws the common
   * `ForbiddenException` if user does not have access.
   *
   * Expects given `productID` to be validated already, will treat a invalid
   * `productID` the same as a Forbidden request.
   */
  async validateUserAccess(
    userID: UserID,
    productID: ProductID,
  ): Promise<void> {
    const canAccess = await this.productRepo.canUserAccessProduct(
      userID,
      productID,
    );

    if (!canAccess)
      throw new ForbiddenException(
        `User ${userID} does not have permission to access Product '${productID}'.`,
      );
  }

  /**
   * Get a single product the user can access.
   */
  async getProduct(userID: UserID, productID: ProductID): Promise<Product> {
    const product = await this.productRepo.getProduct(userID, productID);
    if (product === null)
      throw new NotFoundException(
        `Product with ProductID '${productID}' does not exist.`,
      );

    return product;
  }

  /**
   * Get all products of an Org.
   */
  async getOrgProducts(orgID: OrgID): Promise<Products> {
    // @todo Validate orgID, and if user have permission to this org

    return this.productRepo.getOrgProducts(orgID);
  }

  /**
   * Get all products of the user's Org.
   */
  async getUserOrgProducts(userID: UserID): Promise<Products> {
    return this.productRepo.getUserOrgProducts(userID);
  }

  /**
   * Create a new Product in the user's own Org.
   */
  async createProduct(
    userID: UserID,
    createOneProductDTO: CreateOneProductDTO,
  ): Promise<Product> {
    const org = await this.orgService.getUserOrg(userID, true);
    return this.productRepo.createOne(ulid(), org.id, createOneProductDTO);
  }

  /**
   * Delete a single product.
   */
  async deleteProduct(userID: UserID, productID: ProductID): Promise<void> {
    await this.validateUserAccess(userID, productID);
    await this.productRepo.deleteOne(productID);
  }
}

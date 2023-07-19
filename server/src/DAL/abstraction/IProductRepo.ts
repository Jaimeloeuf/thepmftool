import type { Org, Products, Product, MIT } from 'domain-model';

/**
 * Data Repository interface used as an abstraction over a collection of
 * `Product` Entity objects regardless of the underlying datasource.
 */
export abstract class IProductRepo {
  /**
   * Get all products of an Org.
   */
  abstract getOrgProducts(orgID: Org['id']): Promise<Products>;

  /**
   * Get MITs of the given product's current sprint.
   */
  abstract currentMIT(productID: Product['id']): Promise<Array<MIT>>;
}

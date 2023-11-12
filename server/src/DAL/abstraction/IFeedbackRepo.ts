import type {
  ProductID,
  FeedbackForm,
  CreateOneFeedbackResponseDTO,
  FeedbackResponse,
  FeedbackResponseID,
} from 'domain-model';

export type DBFeedbackResponse = Omit<
  FeedbackResponse,
  'id' | 'productID' | 'createdAt'
> & { created_at: Date };

/**
 * Data Repository interface used as an abstraction over a collection of
 * `Feedback` Entity objects regardless of the underlying datasource.
 */
export abstract class IFeedbackRepo {
  /**
   * Get a single `FeedbackForm` Entity object back
   */
  abstract getOneFeedbackForm(
    productID: ProductID,
  ): Promise<FeedbackForm | null>;

  /**
   * Save response of a feedback form.
   */
  abstract saveOneResponse(
    id: string,
    productID: ProductID,
    response: CreateOneFeedbackResponseDTO,
  ): Promise<FeedbackResponseID>;

  /**
   * Get a Product's survey response stats.
   */
  abstract getResponseStats(productID: ProductID): Promise<number>;

  /**
   * Get a single response.
   */
  abstract getResponse(
    responseID: FeedbackResponseID,
  ): Promise<FeedbackResponse | null>;

  /**
   * Get feedback response data `a2` of the given productID, sorted by most
   * important and oldest first, and up to the first 1000 answers.
   */
  abstract getResponseA2(
    productID: ProductID,
    timeRange: number,
  ): Promise<Array<string>>;

  /**
   * Get all survey responses of the selected product.
   */
  abstract getResponses(
    productID: ProductID,
  ): Promise<Array<DBFeedbackResponse>>;

  /**
   * Get product ID of the given response.
   */
  abstract getResponseProduct(
    responseID: FeedbackResponseID,
  ): Promise<ProductID | null>;
}

import type { ISODateTimeString } from "../utils/Timestamp.js";

/**
 * Type to represent a single Org.
 */
export type Org = {
  /**
   * Unique ID for this Org
   */
  id: string;
  createdAt: ISODateTimeString;
  name: string;
  plan: string;
};

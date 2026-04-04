import { FilterQuery, Model } from 'mongoose';

export interface PaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  order?: 'asc' | 'desc';
  allowedSortFields?: string[]; // Whitelist of allowed sort fields
}

export interface PaginationResult<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
  };
}

/**
 * Paginate Mongoose query results
 * @param model - Mongoose model
 * @param filter - Query filter
 * @param options - Pagination options
 * @param populate - Fields to populate
 * @returns Paginated results with metadata
 */
export const paginate = async <T>(
  model: Model<T>,
  filter: FilterQuery<T>,
  options: PaginationOptions = {},
  populate?: string | string[]
): Promise<PaginationResult<T>> => {
  const page = Math.max(1, options.page || 1);
  const limit = Math.min(100, Math.max(1, options.limit || 10));
  const skip = (page - 1) * limit;
  
  // Validate sortBy against whitelist
  const defaultSortBy = 'createdAt';
  const allowedFields = options.allowedSortFields || [defaultSortBy, 'updatedAt', 'date', 'amount', 'title'];
  const sortBy = options.sortBy && allowedFields.includes(options.sortBy) 
    ? options.sortBy 
    : defaultSortBy;
  
  const order = options.order === 'asc' ? 1 : -1;

  const [data, totalCount] = await Promise.all([
    model
      .find(filter)
      .sort({ [sortBy]: order })
      .skip(skip)
      .limit(limit)
      .populate(populate || ''),
    model.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(totalCount / limit);

  return {
    data: data as T[],
    meta: {
      page,
      limit,
      totalCount,
      totalPages,
    },
  };
};

const { FilterQuery, Model  } = require('mongoose');

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
 * Section 1.3) is always enabled — callers must not call .save() on paginated results
 * @param model - Mongoose model
 * @param filter - Query filter
 * @param options - Pagination options
 * @param populate - Fields to populate
 * @returns Paginated results with metadata
 */
const paginate = async(
  model,
  filter,
  options: PaginationOptions = {},
  populate: string | string[]
)=> {
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

  // Section 1.7: Use hint for countDocuments if provided
  const countQuery = model.countDocuments(filter);
  if (options.hint) {
    countQuery.hint(options.hint);
  }

  const [data, totalCount] = await Promise.all([
    model
      .find(filter)
      .sort({ [sortBy]: order })
      .skip(skip)
      .limit(limit)
      .populate(populate || '')
      .lean(), // Section 1.3) for read-only pagination
    countQuery,
  ]);

  const totalPages = Math.ceil(totalCount / limit);

  return {
    data,
    meta: {
      page,
      limit,
      totalCount,
      totalPages,
    },
  };
};

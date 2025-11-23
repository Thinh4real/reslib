import { defaultArray } from "@utils/defaultArray";
import { isNonNullString } from "@utils/isNonNullString";
import { isNumber } from "@utils/isNumber";
import { extendObj, isObj } from "@utils/object";
import { isStringNumber } from "@utils/string";
import { getQueryParams } from "@utils/uri";
import {
  IResourcePaginationMetaData,
  IResourceQueryOptions,
  IResourceQueryOrderBy,
  NestedPaths,
} from "./types";

export class ResourcePaginationHelper {
  /**
   * Normalizes pagination parameters into a consistent format, calculating missing values and ensuring valid pagination state.
   *
   * This method takes pagination options and normalizes them by calculating the missing pagination parameters
   * (`page`, `skip`, `limit`) based on the provided values. It handles the relationship between page-based
   * and offset-based pagination, ensuring that all three parameters are consistent and valid.
   *
   * **Normalization Logic:**
   * - If `limit` is not a valid number, returns an empty object (no pagination)
   * - If `skip` is provided, calculates the corresponding `page` number
   * - If `page` is provided, calculates the corresponding `skip` offset
   * - If neither `skip` nor `page` are provided, defaults to page 1 with skip 0
   * - Ensures all returned values are valid numbers
   *
   * **Parameter Relationships:**
   * - `page`: 1-based page number (first page = 1)
   * - `skip`: 0-based offset (number of records to skip)
   * - `limit`: Maximum records per page
   * - Formula: `skip = (page - 1) * limit`
   *
   * @template DataType - The resource data type (used for type consistency with IResourceQueryOptions)
   * @param {IResourceQueryOptions<DataType>} [options] - Pagination options containing page, skip, and/or limit
   * @param {number} [options.page] - The page number (1-based)
   * @param {number} [options.skip] - The number of records to skip (0-based offset)
   * @param {number} [options.limit] - The maximum number of records per page
   * @returns {{page?: number, skip?: number, limit?: number}} Normalized pagination parameters:
   *   - `page`: Calculated or provided page number
   *   - `skip`: Calculated or provided skip offset
   *   - `limit`: The limit value (unchanged if valid, omitted if invalid)
   *
   * @example
   * ```typescript
   * // Page-based pagination - calculates skip automatically
   * const result = ResourcePaginationHelper.normalizePagination({
   *   page: 3,
   *   limit: 10
   * });
   * // Result: { page: 3, skip: 20, limit: 10 }
   * // (skip = (3-1) * 10 = 20)
   * ```
   *
   * @example
   * ```typescript
   * // Offset-based pagination - calculates page automatically
   * const result = ResourcePaginationHelper.normalizePagination({
   *   skip: 50,
   *   limit: 25
   * });
   * // Result: { page: 3, skip: 50, limit: 25 }
   * // (page = floor(50/25) + 1 = 3)
   * ```
   *
   * @example
   * ```typescript
   * // Default pagination - no parameters provided
   * const result = ResourcePaginationHelper.normalizePagination({
   *   limit: 20
   * });
   * // Result: { page: 1, skip: 0, limit: 20 }
   * ```
   *
   * @example
   * ```typescript
   * // Invalid limit - returns empty object (no pagination)
   * const result = ResourcePaginationHelper.normalizePagination({
   *   page: 2,
   *   limit: "invalid"
   * });
   * // Result: {}
   * ```
   *
   * @example
   * ```typescript
   * // Zero or negative values - defaults to first page
   * const result = ResourcePaginationHelper.normalizePagination({
   *   page: 0,
   *   limit: 15
   * });
   * // Result: { page: 1, skip: 0, limit: 15 }
   * ```
   *
   * @example
   * ```typescript
   * // Large skip values
   * const result = ResourcePaginationHelper.normalizePagination({
   *   skip: 1000,
   *   limit: 50
   * });
   * // Result: { page: 21, skip: 1000, limit: 50 }
   * // (page = floor(1000/50) + 1 = 21)
   * ```
   *
   * @example
   * ```typescript
   * // Fractional skip values (floor operation)
   * const result = ResourcePaginationHelper.normalizePagination({
   *   skip: 37,
   *   limit: 10
   * });
   * // Result: { page: 4, skip: 37, limit: 10 }
   * // (page = floor(37/10) + 1 = 4)
   * ```
   *
   * @example
   * ```typescript
   * // Mixed parameters - skip takes precedence over page
   * const result = ResourcePaginationHelper.normalizePagination({
   *   page: 2,
   *   skip: 30,
   *   limit: 15
   * });
   * // Result: { page: 3, skip: 30, limit: 15 }
   * // (skip provided, so page is recalculated from skip)
   * ```
   *
   * @example
   * ```typescript
   * // Database cursor scenario
   * const result = ResourcePaginationHelper.normalizePagination({
   *   skip: 500,
   *   limit: 100
   * });
   * // Result: { page: 6, skip: 500, limit: 100 }
   * // Useful for database queries with OFFSET
   * ```
   *
   * @example
   * ```typescript
   * // API pagination with user input
   * const userOptions = { page: 5, limit: 20 };
   * const result = ResourcePaginationHelper.normalizePagination(userOptions);
   * // Result: { page: 5, skip: 80, limit: 20 }
   * // Ready for database query: LIMIT 20 OFFSET 80
   * ```
   *
   * @remarks
   * - Page numbers are 1-based (first page = 1, not 0)
   * - Skip values are 0-based (skip 0 = first record)
   * - Invalid limit values disable pagination entirely
   * - When both page and skip are provided, skip takes precedence for page calculation
   * - Negative or zero page values default to page 1
   * - Fractional skip values are floored when calculating page numbers
   */
  static normalizePagination<DataType = unknown>(
    options?: IResourceQueryOptions<DataType>
  ) {
    let { page, skip, limit } = Object.assign({}, options);
    if (!isNumber(limit)) {
      return {};
    }
    if (isNumber(skip) && skip > 0) {
      // Calculate page when skip is provided
      page = Math.floor(skip / limit) + 1;
    } else if (isNumber(page) && page > 0) {
      // Calculate skip when page is provided
      skip = (page - 1) * limit;
    } else {
      // Default to first page
      page = 1;
      skip = 0;
    }
    return { page, skip, limit };
  }

  /**
   * Normalizes orderBy parameters into a structured object format.
   *
   * This method takes various input formats for sorting criteria and converts them into a consistent
   * object where keys are valid nested property paths and values are sort directions ("asc" or "desc").
   * It handles single strings, arrays of strings, and undefined inputs gracefully.
   *
   * @template T - The resource type to validate paths against
   * @param orderBy - The orderBy specification in various formats:
   *   - `string`: Single field like "name" (ascending) or "-name" (descending)
   *   - `string[]`: Multiple fields like ["name", "-age", "createdAt"]
   *   - `undefined`: No sorting specified
   * @returns A partial record mapping valid nested paths to sort directions
   *
   * @example
   * ```typescript
   * interface User {
   *   id: number;
   *   name: string;
   *   profile: { age: number; address: { city: string } };
   * }
   *
   * // Single ascending field
   * normalizeOrderBy<User>("name")
   * // Returns: { "name": "asc" }
   *
   * // Single descending field
   * normalizeOrderBy<User>("-profile.age")
   * // Returns: { "profile.age": "desc" }
   *
   * // Multiple fields
   * normalizeOrderBy<User>(["name", "-profile.age", "profile.address.city"])
   * // Returns: { "name": "asc", "profile.age": "desc", "profile.address.city": "asc" }
   *
   * // Invalid input (filtered out)
   * normalizeOrderBy<User>([null, "", "name", undefined])
   * // Returns: { "name": "asc" }
   * ```
   *
   * @remarks
   * - Fields starting with "-" are treated as descending order
   * - Invalid or empty strings are silently filtered out
   * - Duplicate fields will log a warning and use the last occurrence
   * - The method performs type assertion to `NestedPaths<T>` - ensure input paths are valid at call site
   */
  static normalizeOrderBy<T = unknown>(
    orderBy?: IResourceQueryOrderBy<T>
  ): Partial<Record<NestedPaths<T>, SortOrder>> {
    const fields = Array.isArray(orderBy)
      ? orderBy
      : isNonNullString(orderBy)
        ? [orderBy]
        : [];

    const result: Partial<Record<NestedPaths<T>, SortOrder>> = {};
    fields.forEach((field) => {
      if (!isNonNullString(field) || String(field).trim() === "") return;
      const isDescending = String(field).startsWith("-");
      const direction: SortOrder = isDescending ? "desc" : "asc";
      const path = isDescending ? String(field).slice(1) : field;
      // Type assertion - caller should ensure path validity
      const key = path as NestedPaths<T>;
      // Warn about duplicates (last one wins)
      if (result[key] !== undefined) {
        console.warn(
          `Duplicate orderBy field: ${path}. Using last occurrence.`
        );
      }
      result[key] = direction;
    });

    return result;
  }

  /***
   * Determines if result can be paginated based on the provided query options.
   * It checks if the query options have a `limit` property of type number.
   * @template DataType The type of resource data.
   * @param {IResourceQueryOptions} queryOptions - The query options.
   * @returns {boolean} Whether the result can be paginated.
   *
   * @example
   * canPaginateResult({ limit: undefined }); //false
   * canPaginateResult({ limit: 10, skip: 20 }); // true
   * canPaginateResult({ page: 3, limit: 10 }); // true
   * canPaginateResult({ page: 3, skip: 20 }); // true
   */
  static canPaginateResult<DataType = unknown>(
    queryOptions: IResourceQueryOptions<DataType>
  ): boolean {
    if (!isObj(queryOptions)) {
      return false;
    }
    return isNumber(queryOptions.limit);
  }
  static getPaginationMetaData<DataType = unknown>(
    count: number,
    queryOptions?: IResourceQueryOptions<DataType>
  ): IResourcePaginationMetaData {
    const { limit, page, skip } =
      ResourcePaginationHelper.normalizePagination(queryOptions);
    count = isNumber(count) ? count : 0;
    const meta: IResourcePaginationMetaData = {
      total: count,
    };
    if (
      typeof limit === "number" &&
      limit > 0 &&
      typeof page === "number" &&
      page >= 0
    ) {
      meta.currentPage = page;
      meta.pageSize = limit;
      meta.totalPages = Math.ceil(count / limit);
      meta.hasNextPage = meta.currentPage < meta.totalPages;
      meta.hasPreviousPage = meta.currentPage > 1;
      meta.nextPage = meta.hasNextPage ? meta.currentPage + 1 : undefined;
      meta.previousPage = meta.hasPreviousPage
        ? meta.currentPage - 1
        : undefined;
      meta.lastPage = meta.totalPages;
    }
    return meta;
  }

  /**
   * Paginates an array of data based on the provided query options and total count.
   *
   * This method applies pagination logic to slice the data array according to the specified
   * page size and current page, while also generating comprehensive pagination metadata.
   * It's designed to work seamlessly with database query results and API responses.
   *
   * **Pagination Logic:**
   * - Calculates the correct slice of data based on `page` and `limit` parameters
   * - Generates metadata including total pages, current page, navigation flags, etc.
   * - Handles edge cases like invalid page numbers or missing pagination parameters
   *
   * **Data Slicing:**
   * - Uses zero-based indexing for array slicing
   * - Ensures start/end indices are within array bounds
   * - Returns empty array if pagination parameters are invalid
   *
   * @template DataType - The type of individual data items in the array
   * @param {DataType[]} data - The complete array of data to be paginated
   * @param {number} count - The total number of records available (may be different from data.length for database queries)
   * @param {IResourceQueryOptions<DataType>} [options] - Pagination and query options
   * @returns {{
   *   data: DataType[],
   *   total: number,
   *   meta: IResourcePaginationMetaData
   * }} An object containing:
   *   - `data`: The paginated slice of the original data array
   *   - `total`: The total count of records (unchanged from input)
   *   - `meta`: Comprehensive pagination metadata
   *
   * @example
   * ```typescript
   * // Basic pagination - page 1 with 10 items per page
   * const users = [{id: 1}, {id: 2}, ..., {id: 25}]; // 25 total users
   * const result = ResourcePaginationHelper.paginate(users, 25, {
   *   page: 1,
   *   limit: 10
   * });
   * // Result:
   * // {
   * //   data: [{id: 1}, {id: 2}, ..., {id: 10}], // First 10 users
   * //   total: 25,
   * //   meta: {
   * //     total: 25,
   * //     currentPage: 1,
   * //     pageSize: 10,
   * //     totalPages: 3,
   * //     hasNextPage: true,
   * //     hasPreviousPage: false,
   * //     nextPage: 2,
   * //     previousPage: undefined,
   * //     lastPage: 3
   * //   }
   * // }
   * ```
   *
   * @example
   * ```typescript
   * // Middle page pagination
   * const result = ResourcePaginationHelper.paginate(users, 25, {
   *   page: 2,
   *   limit: 10
   * });
   * // Result: data contains items 11-20, meta shows navigation to pages 1 and 3
   * ```
   *
   * @example
   * ```typescript
   * // Last page with fewer items
   * const result = ResourcePaginationHelper.paginate(users, 25, {
   *   page: 3,
   *   limit: 10
   * });
   * // Result: data contains items 21-25 (5 items), meta shows no next page
   * ```
   *
   * @example
   * ```typescript
   * // Using skip instead of page
   * const result = ResourcePaginationHelper.paginate(users, 25, {
   *   skip: 15,
   *   limit: 5
   * });
   * // Result: data contains items 16-20, meta shows currentPage: 4
   * ```
   *
   * @example
   * ```typescript
   * // No pagination options - returns all data
   * const result = ResourcePaginationHelper.paginate(users, 25);
   * // Result: data contains all 25 users, meta is minimal (only total)
   * ```
   *
   * @example
   * ```typescript
   * // Invalid page number - clamps to valid range
   * const result = ResourcePaginationHelper.paginate(users, 25, {
   *   page: 999,
   *   limit: 10
   * });
   * // Result: data is empty array, meta shows page: 999 but no valid data slice
   * ```
   *
   * @example
   * ```typescript
   * // Database scenario - data array smaller than total count
   * const dbResult = [{id: 101}, {id: 102}, {id: 103}]; // Only 3 records from DB
   * const result = ResourcePaginationHelper.paginate(dbResult, 150, {
   *   page: 34,
   *   limit: 3
   * });
   * // Result: data contains the 3 DB records, total: 150, meta shows page 34 of ~50
   * ```
   *
   * @example
   * ```typescript
   * // Empty data array
   * const result = ResourcePaginationHelper.paginate([], 0, {
   *   page: 1,
   *   limit: 10
   * });
   * // Result: data is empty array, total: 0, meta shows single empty page
   * ```
   *
   * @example
   * ```typescript
   * // Large dataset pagination
   * const largeDataset = Array.from({length: 10000}, (_, i) => ({id: i + 1}));
   * const result = ResourcePaginationHelper.paginate(largeDataset, 10000, {
   *   page: 500,
   *   limit: 20
   * });
   * // Result: data contains items 9981-10000, meta shows page 500 of 500
   * ```
   */
  static paginate<DataType = unknown>(
    data: DataType[],
    count: number,
    options?: IResourceQueryOptions<DataType>
  ) {
    const meta = ResourcePaginationHelper.getPaginationMetaData(count, options);
    const { currentPage, pageSize, totalPages } = meta;
    if (
      Array.isArray(data) &&
      isNumber(currentPage) &&
      isNumber(pageSize) &&
      isNumber(totalPages)
    ) {
      const startIndex = Math.max(0, currentPage - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      data = data.slice(startIndex, endIndex);
    }
    return {
      data,
      total: count,
      meta,
    };
  }

  /**
   * Parses query options from HTTP request data, extracting and normalizing parameters from multiple sources.
   *
   * This method consolidates query parameters from URL query strings, request headers, route parameters,
   * and custom filters into a standardized `IResourceQueryOptions` object. It's designed for REST API
   * endpoints that need to handle complex query parameters for filtering, sorting, pagination, and more.
   *
   * **Parameter Sources (in precedence order):**
   * 1. URL query parameters (`req.url`)
   * 2. Route parameters (`req.params`)
   * 3. X-Filters header (`req.headers['x-filters']`)
   * 4. Custom filters (`req.filters`)
   *
   * **Supported Parameters:**
   * - **Pagination**: `limit`, `skip`, `page`
   * - **Sorting**: `orderBy` (string, array, or object)
   * - **Filtering**: `where` (object, array, or string conditions)
   * - **Relations**: `include`, `relations` (related data to load)
   * - **Caching**: `cache`, `cacheTTL`
   * - **Soft Deletes**: `includeDeleted`
   * - **Distinct**: `distinct` (unique results)
   *
   * @template T - The resource data type for type-safe query options
   * @param {Object} req - The request object containing query data from multiple sources
   * @param {string} req.url - The request URL containing query parameters
   * @param {Record<string, any>} req.headers - Request headers (may include 'x-filters')
   * @param {Record<string, any>} [req.params] - Route parameters from URL path
   * @param {Record<string, any>} [req.filters] - Custom filter object
   * @returns {IResourceQueryOptions<T> & {queryParams: Record<string, any>}} Normalized query options with:
   *   - All standard `IResourceQueryOptions<T>` properties
   *   - `queryParams`: Raw parsed query parameters for reference
   *
   * @example
   * ```typescript
   * // Basic pagination from URL query
   * const req = {
   *   url: '/api/users?limit=10&page=2',
   *   headers: {}
   * };
   * const options = ResourcePaginationHelper.parseQueryOptions(req);
   * // Result: { limit: 10, page: 2, skip: 10, queryParams: { limit: '10', page: '2' } }
   * ```
   *
   * @example
   * ```typescript
   * // Complex query with multiple sources
   * const req = {
   *   url: '/api/users?limit=20&orderBy=name',
   *   headers: {
   *     'x-filters': {
   *       where: { active: true },
   *       include: ['profile', 'roles']
   *     }
   *   },
   *   params: { userId: '123' },
   *   filters: { cache: true }
   * };
   * const options = ResourcePaginationHelper.parseQueryOptions(req);
   * // Result includes all merged parameters with proper precedence
   * ```
   *
   * @example
   * ```typescript
   * // Sorting with multiple fields
   * const req = {
   *   url: '/api/users?orderBy[]=name&orderBy[]=-createdAt',
   *   headers: {}
   * };
   * const options = ResourcePaginationHelper.parseQueryOptions(req);
   * // Result: { orderBy: { name: 'asc', createdAt: 'desc' }, ... }
   * ```
   *
   * @example
   * ```typescript
   * // Filtering with complex where conditions
   * const req = {
   *   url: '/api/users',
   *   headers: {
   *     'x-filters': {
   *       where: {
   *         age: { $gte: 18 },
   *         status: 'active',
   *         $or: [{ role: 'admin' }, { role: 'moderator' }]
   *       }
   *     }
   *   }
   * };
   * const options = ResourcePaginationHelper.parseQueryOptions(req);
   * // Result includes complex where conditions for database queries
   * ```
   *
   * @example
   * ```typescript
   * // Including related data
   * const req = {
   *   url: '/api/posts?include[]=author&include[]=comments',
   *   headers: {
   *     'x-filters': {
   *       relations: ['tags', 'categories']
   *     }
   *   }
   * };
   * const options = ResourcePaginationHelper.parseQueryOptions(req);
   * // Result: { include: ['author', 'comments'], relations: ['tags', 'categories'], ... }
   * ```
   *
   * @example
   * ```typescript
   * // Caching configuration
   * const req = {
   *   url: '/api/users?cache=1&cacheTTL=300',
   *   headers: {}
   * };
   * const options = ResourcePaginationHelper.parseQueryOptions(req);
   * // Result: { cache: true, cacheTTL: 300, ... }
   * ```
   *
   * @example
   * ```typescript
   * // Distinct results and soft deletes
   * const req = {
   *   url: '/api/users?distinct=1&includeDeleted=true',
   *   headers: {}
   * };
   * const options = ResourcePaginationHelper.parseQueryOptions(req);
   * // Result: { distinct: true, includeDeleted: true, ... }
   * ```
   *
   * @example
   * ```typescript
   * // Express.js style request object
   * const expressReq = {
   *   url: '/api/users?limit=5&page=1&orderBy=name',
   *   headers: {
   *     'x-filters': JSON.stringify({ where: { active: true } })
   *   },
   *   params: { tenantId: 'abc123' },
   *   query: { search: 'john' } // Additional query params
   * };
   * const options = ResourcePaginationHelper.parseQueryOptions(expressReq);
   * // Handles all Express.js request formats automatically
   * ```
   *
   * @example
   * ```typescript
   * // Minimal request - only URL parameters
   * const req = {
   *   url: '/api/users',
   *   headers: {}
   * };
   * const options = ResourcePaginationHelper.parseQueryOptions(req);
   * // Result: { queryParams: {} } - minimal options, no pagination/sorting
   * ```
   *
   * @example
   * ```typescript
   * // Mixed data types and type coercion
   * const req = {
   *   url: '/api/users?limit=10&page=2&cache=true&includeDeleted=0',
   *   headers: {
   *     'x-filters': {
   *       distinct: '1',  // String '1' becomes boolean true
   *       cacheTTL: '600' // String '600' becomes number 600
   *     }
   *   }
   * };
   * const options = ResourcePaginationHelper.parseQueryOptions(req);
   * // Result: proper type coercion for all parameters
   * ```
   */
  static parseQueryOptions<T = unknown>(req: {
    url: string;
    headers: Record<string, any>;
    params?: Record<string, any>;
    filters?: Record<string, any>;
  }): IResourceQueryOptions<T> & { queryParams: Record<string, any> } {
    const queryParams = extendObj({}, req?.params, getQueryParams(req?.url));
    const xFilters = extendObj(
      {},
      queryParams,
      req?.headers?.["x-filters"],
      req?.filters
    );
    const limit = parseNumber(xFilters.limit);
    const skip = parseNumber(xFilters.skip);
    const page = parseNumber(xFilters.page);
    const result: IResourceQueryOptions<T> =
      ResourcePaginationHelper.normalizePagination({ limit, skip, page });
    let distinct = xFilters.distinct;
    if (typeof distinct == "number") {
      distinct = !!distinct;
    }
    if (
      typeof distinct === "boolean" ||
      (Array.isArray(distinct) && distinct.length)
    ) {
      result.distinct = distinct;
    }
    const defaultOrderBy = xFilters.orderBy;
    const orderBy = ResourcePaginationHelper.normalizeOrderBy(defaultOrderBy);
    if (orderBy && Object.getSize(orderBy, true) > 0) {
      (result as any).orderBy = orderBy;
    }
    const include = defaultArray<any>(xFilters.include);
    if (include.length) {
      result.include = include as any;
    }
    const cache = xFilters.cache;
    if (cache !== undefined) {
      result.cache = !!cache;
    }
    const cacheTTL = xFilters.cacheTTL;
    if (cacheTTL !== undefined) {
      result.cacheTTL = cacheTTL;
    }
    const where = defaultArrayOrStringOrObject(xFilters.where);
    if (isObj(where) && Object.getSize(where, true)) {
      result.where = where;
    }
    const includeDeleted = xFilters.includeDeleted;
    if (typeof includeDeleted === "boolean") {
      result.includeDeleted = includeDeleted;
    }
    const relations = defaultArray(xFilters.relations);
    if (relations.length) {
      result.relations = relations;
    }
    return { ...result, queryParams };
  }
}

const defaultArrayOrStringOrObject = (...args: any[]) => {
  for (const arg of args) {
    if (Array.isArray(arg) && arg.length) {
      return arg;
    }
    if (isNonNullString(arg)) {
      return arg;
    }
    if (isObj(arg) && Object.getSize(arg, true)) {
      return arg;
    }
  }
  return undefined;
};

const parseNumber = (value: any) => {
  if (isStringNumber(value)) {
    return Number(value);
  }
  if (typeof value === "number") {
    return value;
  }
  return undefined;
};

type SortOrder = "asc" | "desc";

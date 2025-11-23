/**
 * Represents the complete set of filter options available for Prisma's find operations.
 * This interface provides type-safe filtering capabilities for database queries.
 * 
 * @typeParam T - The type of the field being filtered
 * 
 * @example
 * ```typescript
 * // Finding all users over 18 years old with gmail
 * const adult_gmail_users = await prisma.user.findMany({
 *   where: {
 *     age: { gt: 18 },
 *     email: { endsWith: "@gmail.com" }
 *   }
 * });
 * 
 * // Complex query combining multiple conditions
 * const results = await prisma.post.findMany({
 *   where: {
 *     OR: [
 *       { published: true },
 *       { author: { is: { role: "ADMIN" } } }
 *     ],
 *     AND: [
 *       { title: { contains: "prisma" } },
 *       { views: { gt: 100 } }
 *     ]
 *   }
 * });
 * ```
 */
interface IQueryWhereOptions<T> {
    /**
     * Matches values that are exactly equal to the specified value.
     * Accepts null to query for null values.
     * 
     * @example
     * ```typescript
     * { status: { equals: "PUBLISHED" } }
     * { deletedAt: { equals: null } }
     * ```
     */
    equals?: T | null;

    /**
     * Negates a filter, matching all values that do not match the specified condition.
     * Can be used with a direct value or a nested where condition.
     * 
     * @example
     * ```typescript
     * { role: { not: "GUEST" } }
     * { age: { not: { gt: 18 } } }
     * ```
     */
    not?: T | NestedWhereInput<T> | null;

    /**
     * Matches values that are included in the specified array.
     * 
     * @example
     * ```typescript
     * { status: { in: ["PUBLISHED", "DRAFT"] } }
     * { categoryId: { in: [1, 2, 3] } }
     * ```
     */
    in?: T[] | null;

    /**
     * Matches values that are not included in the specified array.
     * 
     * @example
     * ```typescript
     * { status: { notIn: ["DELETED", "ARCHIVED"] } }
     * ```
     */
    notIn?: T[] | null;

    /**
     * Matches values that are less than the specified value.
     * Commonly used with numbers and dates.
     * 
     * @example
     * ```typescript
     * { age: { lt: 18 } }
     * { createdAt: { lt: new Date() } }
     * ```
     */
    lt?: T | null;

    /**
     * Matches values that are less than or equal to the specified value.
     * 
     * @example
     * ```typescript
     * { price: { lte: 100 } }
     * ```
     */
    lte?: T | null;

    /**
     * Matches values that are greater than the specified value.
     * 
     * @example
     * ```typescript
     * { views: { gt: 1000 } }
     * ```
     */
    gt?: T | null;

    /**
     * Matches values that are greater than or equal to the specified value.
     * 
     * @example
     * ```typescript
     * { rating: { gte: 4.5 } }
     * ```
     */
    gte?: T | null;

    /**
     * String-specific operator that matches values containing the specified string.
     * Can be case sensitive or insensitive based on the mode parameter.
     * 
     * @example
     * ```typescript
     * { title: { contains: "prisma", mode: "insensitive" } }
     * { description: { contains: "featured" } }
     * ```
     */
    contains?: string | null;

    /**
     * String-specific operator that matches values starting with the specified string.
     * 
     * @example
     * ```typescript
     * { email: { startsWith: "john" } }
     * { path: { startsWith: "/api/" } }
     * ```
     */
    startsWith?: string | null;

    /**
     * String-specific operator that matches values ending with the specified string.
     * 
     * @example
     * ```typescript
     * { email: { endsWith: "@gmail.com" } }
     * { filename: { endsWith: ".pdf" } }
     * ```
     */
    endsWith?: string | null;

    /**
     * Full-text search operator (only available with supported databases).
     * 
     * @example
     * ```typescript
     * { content: { search: "prisma database" } }
     * ```
     */
    search?: string | null;

    /**
     * Specifies the case sensitivity mode for string operations.
     * 
     * @example
     * ```typescript
     * { 
     *   email: { 
     *     contains: "JOHN",
     *     mode: "insensitive"
     *   } 
     * }
     * ```
     */
    mode?: 'default' | 'insensitive';

    /**
     * Array-specific operator that checks if an array contains a specific value.
     * 
     * @example
     * ```typescript
     * { tags: { has: "featured" } }
     * ```
     */
    has?: T;

    /**
     * Array-specific operator that checks if an array contains all specified values.
     * 
     * @example
     * ```typescript
     * { categories: { hasEvery: ["tech", "tutorial"] } }
     * ```
     */
    hasEvery?: T[];

    /**
     * Array-specific operator that checks if an array contains any of the specified values.
     * 
     * @example
     * ```typescript
     * { roles: { hasSome: ["ADMIN", "MODERATOR"] } }
     * ```
     */
    hasSome?: T[];

    /**
     * Array-specific operator that checks if an array is empty.
     * 
     * @example
     * ```typescript
     * { comments: { isEmpty: true } }
     * ```
     */
    isEmpty?: boolean;

    /**
     * Checks if a field is set (not undefined).
     * 
     * @example
     * ```typescript
     * { metadata: { isSet: true } }
     * ```
     */
    isSet?: boolean;

    /**
     * Logical AND operator - all conditions must be true.
     * 
     * @example
     * ```typescript
     * {
     *   AND: [
     *     { published: true },
     *     { author: { is: { verified: true } } }
     *   ]
     * }
     * ```
     */
    AND?: IQueryWhereOptions<T>[];

    /**
     * Logical OR operator - at least one condition must be true.
     * 
     * @example
     * ```typescript
     * {
     *   OR: [
     *     { status: "PUBLISHED" },
     *     { featured: true }
     *   ]
     * }
     * ```
     */
    OR?: IQueryWhereOptions<T>[];

    /**
     * Logical NOT operator - negates a set of conditions.
     * 
     * @example
     * ```typescript
     * {
     *   NOT: [
     *     { status: "DELETED" },
     *     { archived: true }
     *   ]
     * }
     * ```
     */
    NOT?: IQueryWhereOptions<T> | IQueryWhereOptions<T>[];

    /**
     * Relation filter - matches if any related record matches the conditions.
     * 
     * @example
     * ```typescript
     * {
     *   posts: {
     *     some: {
     *       published: true,
     *       views: { gt: 100 }
     *     }
     *   }
     * }
     * ```
     */
    some?: IQueryWhereOptions<T>;

    /**
     * Relation filter - matches if all related records match the conditions.
     * 
     * @example
     * ```typescript
     * {
     *   comments: {
     *     every: {
     *       approved: true
     *     }
     *   }
     * }
     * ```
     */
    every?: IQueryWhereOptions<T>;

    /**
     * Relation filter - matches if no related records match the conditions.
     * 
     * @example
     * ```typescript
     * {
     *   reports: {
     *     none: {
     *       severity: "HIGH"
     *     }
     *   }
     * }
     * ```
     */
    none?: IQueryWhereOptions<T>;

    /**
     * DateTime-specific comparison operator.
     * 
     * @example
     * ```typescript
     * { createdAt: { datetime: new Date() } }
     * ```
     */
    datetime?: T | null;

    /**
     * Date-specific comparison operator (ignores time).
     * 
     * @example
     * ```typescript
     * { birthDate: { date: new Date('1990-01-01') } }
     * ```
     */
    date?: T | null;

    /**
     * Time-specific comparison operator (ignores date).
     * 
     * @example
     * ```typescript
     * { scheduledTime: { time: new Date('2023-01-01T14:30:00') } }
     * ```
     */
    time?: T | null;
}

/**
 * Helper interface for nested where conditions in filter operations.
 * This interface provides a subset of filter options for nested queries.
 * 
 * @typeParam T - The type of the nested field being filtered
 * 
 * @example
 * ```typescript
 * // Using nested where conditions
 * const users = await prisma.user.findMany({
 *   where: {
 *     posts: {
 *       some: {
 *         NOT: {
 *           title: { contains: "draft" }
 *         }
 *       }
 *     }
 *   }
 * });
 * ```
 */
interface NestedWhereInput<T> {
    equals?: T;
    in?: T[];
    notIn?: T[];
    lt?: T;
    lte?: T;
    gt?: T;
    gte?: T;
    contains?: string;
    startsWith?: string;
    endsWith?: string;
    AND?: NestedWhereInput<T>[];
    OR?: NestedWhereInput<T>[];
    NOT?: NestedWhereInput<T>;
}


/**
* Represents the complete set of filter options available for Prisma's find operations.
* This interface provides type-safe filtering capabilities for database queries.
* 
* @typeParam T - The type of the field being filtered
* 
* @example
* ```typescript
* // Direct field matching without operators
* const users = await prisma.user.findMany({
*   where: {
*     email: "john@example.com",    // Direct equality
*     age: 25,                      // Direct equality
*     role: "ADMIN"                 // Direct equality
*   }
* });
* 
* 
* const results = await prisma.post.findMany({
*   where: {
*     published: true,              // Direct boolean match
*     title: { contains: "prisma" }, // Using operator
*     authorId: 1,                  // Direct equality
*     views: { gt: 100 }            // Using operator
*   }
* });
* ```
*/
interface FindWhereOptions<T> {


    // ... (all previous operators remain the same)
}

/**
 * Helper type to separate direct field assignments from operator conditions
 */
interface WhereOperators<T> {
    equals?: T | null;
    not?: T | NestedWhereInput<T> | null;
    in?: T[] | null;
    notIn?: T[] | null;
    lt?: T | null;
    lte?: T | null;
    gt?: T | null;
    gte?: T | null;
    contains?: string | null;
    startsWith?: string | null;
    endsWith?: string | null;
    search?: string | null;
    mode?: 'default' | 'insensitive';
    has?: T;
    hasEvery?: T[];
    hasSome?: T[];
    isEmpty?: boolean;
    isSet?: boolean;
    AND?: FindWhereOptions<T>[];
    OR?: FindWhereOptions<T>[];
    NOT?: FindWhereOptions<T> | FindWhereOptions<T>[];
    some?: FindWhereOptions<T>;
    every?: FindWhereOptions<T>;
    none?: FindWhereOptions<T>;
    datetime?: T | null;
    date?: T | null;
    time?: T | null;
}

// ... (NestedWhereInput interface remains the same)
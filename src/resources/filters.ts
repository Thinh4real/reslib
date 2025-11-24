import {
  MongoArrayOperators,
  MongoComparisonOperatorName,
  MongoLogicalOperatorName,
  MongoLogicalOperators,
  MongoOperatorName,
} from './types';

const LOGICAL: MongoLogicalOperatorName[] = ['$and', '$or', '$nor', '$not'];
const COMPARAISON: MongoComparisonOperatorName[] = [
  '$eq',
  '$ne',
  '$gt',
  '$gte',
  '$lt',
  '$lte',
  '$in',
  '$nin',
  '$exists',
  '$type',
  '$regex',
  '$size',
  '$mod',
  '$all',
  '$elemMatch',
];

/**
 * A collection of MongoDB operators categorized into logical, comparison, and array operators.
 *
 * This constant provides a structured way to access various MongoDB operators that can be used
 * in queries. Each category contains a list of operator keys that correspond to their respective
 * types in MongoDB.
 *
 * @constant
 * @type {Object}
 * @property {Array<keyof MongoLogicalOperators>} LOGICAL - An array of logical operators.
 *   - **Example**:
 *     - `$and`: Joins query clauses with a logical AND.
 *     - `$or`: Joins query clauses with a logical OR.
 *     - `$nor`: Joins query clauses with a logical NOR.
 *     - `$not`: Inverts the effect of a query expression.
 *
 * @property {Array<keyof MongoComparisonOperators>} COMPARAISON - An array of comparison operators.
 *   - **Example**:
 *     - `$eq`: Matches values that are equal to a specified value.
 *     - `$ne`: Matches all values that are not equal to a specified value.
 *     - `$gt`: Matches values that are greater than a specified value.
 *     - `$gte`: Matches values that are greater than or equal to a specified value.
 *     - `$lt`: Matches values that are less than a specified value.
 *     - `$lte`: Matches values that are less than or equal to a specified value.
 *     - `$in`: Matches any of the values specified in an array.
 *     - `$nin`: Matches none of the values specified in an array.
 *     - `$exists`: Matches documents that have the specified field.
 *     - `$type`: Matches documents based on the type of the field.
 *     - `$regex`: Matches documents where the field value matches a specified regular expression.
 *     - `$size`: Matches any array with the number of elements specified.
 *     - `$mod`: Matches documents where the value of a field is equal to the specified value when divided by a specified divisor.
 *     - `$all`: Matches arrays that contain all elements specified in the query.
 *     - `$elemMatch`: Matches documents that contain an array field with at least one element that matches all the specified query criteria.
 *
 * @property {Array<keyof MongoArrayOperators>} ARRAY - An array of array operators.
 *   - **Example**:
 *     - `$all`: Matches arrays that contain all elements specified in the query.
 *     - `$elemMatch`: Matches documents that contain an array field with at least one element that matches all the specified query criteria.
 *     - `$in`: Matches any of the values specified in an array.
 *     - `$nin`: Matches none of the values specified in an array.
 * @property {Array<keyof MongoOperators>} ALL - An array of all operators.
 * @example
 * // Example usage of MONGO_OPERATORS in a MongoDB query
 * const query = {
 *   $or: [
 *     { age: { $gt: 18 } },
 *     { name: { $regex: /John/i } }
 *   ]
 * };
 *
 * // This query will find documents where the age is greater than 18
 * // or the name matches the regex for "John".
 *
 * @see {@link https://docs.mongodb.com/manual/reference/operator/|MongoDB Operators Documentation} for more details on each operator.
 */
export const MONGO_OPERATORS: {
  LOGICAL: (keyof MongoLogicalOperators)[];
  COMPARAISON: MongoComparisonOperatorName[];
  ARRAY: (keyof MongoArrayOperators)[];
  ALL: MongoOperatorName[];
} = {
  LOGICAL,
  COMPARAISON,
  ALL: [...LOGICAL, ...COMPARAISON],
  ARRAY: ['$all', '$elemMatch', '$in', '$nin'] as (keyof MongoArrayOperators)[],
};

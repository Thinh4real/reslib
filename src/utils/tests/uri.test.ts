import {
  extractQueryString,
  getQueryParams,
  isDataUrl,
  isUriEncoded,
  isUrl,
  objectToQueryString,
  removeQueryString,
  setQueryParams,
} from '../index';

describe('URI Utils', () => {
  describe('extractQueryString', () => {
    it('should return the query string with a leading "?"', () => {
      const url = 'https://example.com/path?a=1&b=2';
      expect(extractQueryString(url)).toBe('?a=1&b=2');
    });

    it('should return the query string without a leading "?"', () => {
      const url = 'https://example.com/path?a=1&b=2';
      expect(extractQueryString(url, false)).toBe('a=1&b=2');
    });

    it('should return an empty string for a URL without a query string', () => {
      const url = 'https://example.com/path';
      expect(extractQueryString(url)).toBe('');
    });
  });

  describe('getQueryParams', () => {
    it('should return query parameters as an object', () => {
      const url = 'https://example.com/path?a=1&b=2&c[]=3&c[]=4';
      expect(getQueryParams(url)).toEqual({ a: '1', b: '2', c: ['3', '4'] });
    });

    it('should return an empty object for a URL without a query string', () => {
      const url = 'https://example.com/path';
      expect(getQueryParams(url)).toEqual({});
    });

    describe('Basic parameter types', () => {
      it('should parse string values', () => {
        const url = 'https://example.com?name=john&city=new+york';
        expect(getQueryParams(url)).toEqual({ name: 'john', city: 'new york' });
      });

      it('should parse numeric values as strings', () => {
        const url = 'https://example.com?age=25&price=19.99';
        expect(getQueryParams(url)).toEqual({ age: '25', price: '19.99' });
      });

      it('should parse boolean-like values as strings', () => {
        const url = 'https://example.com?active=true&disabled=false';
        expect(getQueryParams(url)).toEqual({
          active: 'true',
          disabled: 'false',
        });
      });

      it('should parse null values as strings', () => {
        const url = 'https://example.com?value=null&empty=';
        expect(getQueryParams(url)).toEqual({ value: 'null', empty: '' });
      });
    });

    describe('Array parameters', () => {
      it('should parse bracket notation arrays', () => {
        const url = 'https://example.com?tags[]=red&tags[]=blue&tags[]=green';
        expect(getQueryParams(url)).toEqual({ tags: ['red', 'blue', 'green'] });
      });

      it('should parse indexed arrays', () => {
        const url =
          'https://example.com?items[0]=apple&items[1]=banana&items[2]=orange';
        expect(getQueryParams(url)).toEqual({
          items: ['apple', 'banana', 'orange'],
        });
      });

      it('should parse mixed array notations', () => {
        const url =
          'https://example.com?list[]=a&list[]=b&indexed[0]=x&indexed[1]=y';
        expect(getQueryParams(url)).toEqual({
          list: ['a', 'b'],
          indexed: ['x', 'y'],
        });
      });

      it('should handle empty arrays', () => {
        const url = 'https://example.com?empty[]=';
        expect(getQueryParams(url)).toEqual({ empty: [''] });
      });

      it('should handle sparse arrays', () => {
        const url = 'https://example.com?sparse[0]=first&sparse[2]=third';
        expect(getQueryParams(url)).toEqual({
          sparse: ['first', undefined, 'third'],
        });
      });
    });

    describe('Nested objects', () => {
      it('should parse bracket notation nested objects', () => {
        const url =
          'https://example.com?user[name]=john&user[age]=30&user[address][city]=NYC';
        expect(getQueryParams(url)).toEqual({
          user: {
            name: 'john',
            age: '30',
            address: { city: 'NYC' },
          },
        });
      });

      it('should parse dot notation nested objects', () => {
        const url =
          'https://example.com?config.database.host=localhost&config.database.port=5432';
        expect(getQueryParams(url)).toEqual({
          'config.database.host': 'localhost',
          'config.database.port': '5432',
        });
      });

      it('should handle complex nested structures', () => {
        const url =
          'https://example.com?query[where][and][0][status]=active&query[where][and][1][category]=tech&query[limit]=10';
        expect(getQueryParams(url)).toEqual({
          query: {
            where: {
              and: [{ status: 'active' }, { category: 'tech' }],
            },
            limit: '10',
          },
        });
      });
    });

    describe('Special characters and encoding', () => {
      it('should decode URL-encoded values', () => {
        const url =
          'https://example.com?message=hello%20world&email=user%40example.com';
        expect(getQueryParams(url)).toEqual({
          message: 'hello world',
          email: 'user@example.com',
        });
      });

      it('should handle plus signs as spaces', () => {
        const url = 'https://example.com?text=hello+world&equation=2%2B2%3D4';
        expect(getQueryParams(url)).toEqual({
          text: 'hello world',
          equation: '2+2=4',
        });
      });

      it('should handle special characters in keys and values', () => {
        const url =
          'https://example.com?key%20with%20spaces=value%26more&special%40key=%3Ctag%3E';
        expect(getQueryParams(url)).toEqual({
          'key with spaces': 'value&more',
          'special@key': '<tag>',
        });
      });

      it('should handle Unicode characters', () => {
        const url = 'https://example.com?name=José&city=München&emoji=🚀';
        expect(getQueryParams(url)).toEqual({
          name: 'José',
          city: 'München',
          emoji: '🚀',
        });
      });
    });

    describe('Edge cases', () => {
      it('should handle URLs with fragments', () => {
        const url = 'https://example.com?a=1&b=2#section';
        expect(getQueryParams(url)).toEqual({ a: '1', b: '2' });
      });

      it('should handle URLs with only query string', () => {
        const url = '?a=1&b=2';
        expect(getQueryParams(url)).toEqual({ a: '1', b: '2' });
      });

      it('should handle malformed query strings', () => {
        const url = 'https://example.com?a=1&&b=2&c=';
        expect(getQueryParams(url)).toEqual({ a: '1', b: '2', c: '' });
      });

      it('should handle duplicate keys', () => {
        const url = 'https://example.com?key=value1&key=value2&key=value3';
        expect(getQueryParams(url)).toEqual({
          key: ['value1', 'value2', 'value3'],
        });
      });

      it('should handle empty keys', () => {
        const url = 'https://example.com?=value&=another&=third';
        expect(getQueryParams(url)).toEqual({});
      });

      it('should handle keys without values', () => {
        const url = 'https://example.com?flag&another&third=';
        expect(getQueryParams(url)).toEqual({
          flag: '',
          another: '',
          third: '',
        });
      });
    });

    describe('Complex real-world scenarios', () => {
      it('should parse API query parameters with filters', () => {
        const url =
          'https://api.example.com/users?filter[name]=john&filter[age][gte]=18&filter[active]=true&sort=name&limit=10';
        expect(getQueryParams(url)).toEqual({
          filter: {
            name: 'john',
            age: { gte: '18' },
            active: 'true',
          },
          sort: 'name',
          limit: '10',
        });
      });

      it('should parse search queries with operators', () => {
        const url =
          'https://search.example.com?q=typescript&operator=AND&fields[]=title&fields[]=content&boost[title]=2';
        expect(getQueryParams(url)).toEqual({
          q: 'typescript',
          operator: 'AND',
          fields: ['title', 'content'],
          boost: { title: '2' },
        });
      });

      it('should parse complex nested OR conditions', () => {
        const url =
          'https://api.example.com/search?where[or][0][title][contains]=test&where[or][1][description][contains]=test&where[or][2][tags][in][]=tag1&where[or][2][tags][in][]=tag2';
        expect(getQueryParams(url)).toEqual({
          where: {
            or: [
              { title: { contains: 'test' } },
              { description: { contains: 'test' } },
              { tags: { in: ['tag1', 'tag2'] } },
            ],
          },
        });
      });
    });
  });

  describe('removeQueryString', () => {
    it('should remove the query string from a URL', () => {
      const url = 'https://example.com/path?a=1&b=2#fragment';
      expect(removeQueryString(url)).toBe('https://example.com/path');
    });

    it('should decode the resulting URL if _decodeURIComponent is true', () => {
      const url = 'https://example.com/path%20with%20spaces?a=1&b=2';
      expect(removeQueryString(url, true)).toBe(
        'https://example.com/path with spaces'
      );
    });
  });

  describe('setQueryParams', () => {
    it('should add query parameters to a URL', () => {
      const url = 'https://example.com/path';
      expect(setQueryParams(url, 'a', 1)).toBe('https://example.com/path?a=1');
      expect(setQueryParams(url, { a: 1, b: 2 })).toBe(
        'https://example.com/path?a=1&b=2'
      );
    });

    it('should merge new query parameters with existing ones', () => {
      const url = 'https://example.com/path?a=1';
      expect(setQueryParams(url, 'b', 2)).toBe(
        'https://example.com/path?a=1&b=2'
      );
    });

    describe('Basic parameter types', () => {
      it('should handle string values', () => {
        const url = 'https://example.com';
        expect(setQueryParams(url, 'name', 'john')).toBe(
          'https://example.com?name=john'
        );
        expect(setQueryParams(url, 'message', 'hello world')).toBe(
          'https://example.com?message=hello%20world'
        );
      });

      it('should handle numeric values', () => {
        const url = 'https://example.com';
        expect(setQueryParams(url, 'age', 25)).toBe(
          'https://example.com?age=25'
        );
        expect(setQueryParams(url, 'price', 19.99)).toBe(
          'https://example.com?price=19.99'
        );
      });

      it('should handle boolean values', () => {
        const url = 'https://example.com';
        expect(setQueryParams(url, 'active', true)).toBe(
          'https://example.com?active=true'
        );
        expect(setQueryParams(url, 'disabled', false)).toBe(
          'https://example.com?disabled=false'
        );
      });

      it('should handle null and undefined values', () => {
        const url = 'https://example.com';
        expect(setQueryParams(url, 'value', null)).toBe(
          'https://example.com?value='
        );
        expect(setQueryParams(url, 'empty', undefined)).toBe(
          'https://example.com'
        );
      });

      it('should handle empty string values', () => {
        const url = 'https://example.com';
        expect(setQueryParams(url, 'empty', '')).toBe(
          'https://example.com?empty='
        );
      });
    });

    describe('Array parameters', () => {
      it('should serialize arrays with indexed notation', () => {
        const url = 'https://example.com';
        expect(setQueryParams(url, 'tags', ['red', 'blue', 'green'])).toBe(
          'https://example.com?tags[0]=red&tags[1]=blue&tags[2]=green'
        );
      });

      it('should handle empty arrays', () => {
        const url = 'https://example.com';
        expect(setQueryParams(url, 'empty', [])).toBe('https://example.com');
      });

      it('should handle arrays with mixed types', () => {
        const url = 'https://example.com';
        expect(setQueryParams(url, 'mixed', [1, 'two', true, null])).toBe(
          'https://example.com?mixed[0]=1&mixed[1]=two&mixed[2]=true&mixed[3]='
        );
      });

      it('should handle sparse arrays', () => {
        const url = 'https://example.com';
        const sparse = [];
        sparse[0] = 'first';
        sparse[2] = 'third';
        expect(setQueryParams(url, 'sparse', sparse)).toBe(
          'https://example.com?sparse[0]=first&sparse[2]=third'
        );
      });
    });

    describe('Nested objects', () => {
      it('should serialize nested objects with bracket notation', () => {
        const url = 'https://example.com';
        const obj = { user: { name: 'john', age: 30 } };
        expect(setQueryParams(url, obj)).toBe(
          'https://example.com?user[name]=john&user[age]=30'
        );
      });

      it('should handle deeply nested objects', () => {
        const url = 'https://example.com';
        const obj = {
          config: {
            database: {
              host: 'localhost',
              port: 5432,
              credentials: { user: 'admin', pass: 'secret' },
            },
          },
        };
        expect(setQueryParams(url, obj)).toBe(
          'https://example.com?config[database][host]=localhost&config[database][port]=5432&config[database][credentials][user]=admin&config[database][credentials][pass]=secret'
        );
      });

      it('should handle objects with array properties', () => {
        const url = 'https://example.com';
        const obj = {
          query: {
            tags: ['red', 'blue'],
            filters: { active: true, category: 'tech' },
          },
        };
        expect(setQueryParams(url, obj)).toBe(
          'https://example.com?query[tags][0]=red&query[tags][1]=blue&query[filters][active]=true&query[filters][category]=tech'
        );
      });
    });

    describe('Special characters and encoding', () => {
      it('should encode special characters in values', () => {
        const url = 'https://example.com';
        expect(setQueryParams(url, 'message', 'hello world')).toBe(
          'https://example.com?message=hello%20world'
        );
        expect(setQueryParams(url, 'email', 'user@example.com')).toBe(
          'https://example.com?email=user%40example.com'
        );
        expect(setQueryParams(url, 'query', 'name=john&age=30')).toBe(
          'https://example.com?query=name%3Djohn%26age%3D30'
        );
      });

      it('should encode special characters in keys', () => {
        const url = 'https://example.com';
        expect(setQueryParams(url, 'key with spaces', 'value')).toBe(
          'https://example.com?key%20with%20spaces=value'
        );
        expect(setQueryParams(url, 'special@key', 'value')).toBe(
          'https://example.com?special%40key=value'
        );
      });

      it('should handle Unicode characters', () => {
        const url = 'https://example.com';
        expect(setQueryParams(url, 'name', 'José')).toBe(
          'https://example.com?name=Jos%C3%A9'
        );
        expect(setQueryParams(url, 'city', 'München')).toBe(
          'https://example.com?city=M%C3%BCnchen'
        );
      });

      it('should handle emoji and special symbols', () => {
        const url = 'https://example.com';
        expect(setQueryParams(url, 'icon', '🚀')).toBe(
          'https://example.com?icon=%F0%9F%9A%80'
        );
        expect(setQueryParams(url, 'math', '∑')).toBe(
          'https://example.com?math=%E2%88%91'
        );
      });
    });

    describe('Merging with existing parameters', () => {
      it('should merge with existing query parameters', () => {
        const url = 'https://example.com?existing=old';
        expect(setQueryParams(url, 'new', 'value')).toBe(
          'https://example.com?existing=old&new=value'
        );
      });

      it('should override existing parameters with same key', () => {
        const url = 'https://example.com?key=old';
        expect(setQueryParams(url, 'key', 'new')).toBe(
          'https://example.com?key=new'
        );
      });

      it('should handle complex merging scenarios', () => {
        const url = 'https://example.com?filter[active]=false&sort=name';
        const newParams = { 'filter[category]': 'tech', limit: 10 };
        expect(setQueryParams(url, newParams)).toBe(
          'https://example.com?filter[active]=false&sort=name&filter[category]=tech&limit=10'
        );
      });

      it('should preserve fragments when merging', () => {
        const url = 'https://example.com?existing=value#section';
        expect(setQueryParams(url, 'new', 'param')).toBe(
          'https://example.com?existing=value&new=param#section'
        );
      });
    });

    describe('Edge cases', () => {
      it('should handle URLs with only query strings', () => {
        const url = '?existing=value';
        expect(setQueryParams(url, 'new', 'param')).toBe(
          '?existing=value&new=param'
        );
      });

      it('should handle URLs with fragments', () => {
        const url = 'https://example.com#section';
        expect(setQueryParams(url, 'param', 'value')).toBe(
          'https://example.com?param=value#section'
        );
      });

      it('should handle URLs with both query and fragment', () => {
        const url = 'https://example.com?existing=value#section';
        expect(setQueryParams(url, 'new', 'param')).toBe(
          'https://example.com?existing=value&new=param#section'
        );
      });

      it('should handle empty base URLs', () => {
        expect(setQueryParams('', 'param', 'value')).toBe('?param=value');
      });

      it('should handle malformed URLs gracefully', () => {
        const url = 'not-a-url';
        expect(setQueryParams(url, 'param', 'value')).toBe(
          'not-a-url?param=value'
        );
      });
    });

    describe('Complex real-world scenarios', () => {
      it('should serialize API filter parameters', () => {
        const url = 'https://api.example.com/users';
        const filters = {
          filter: {
            name: 'john',
            age: { gte: 18 },
            active: true,
          },
          sort: 'name',
          limit: 10,
        };
        expect(setQueryParams(url, filters)).toBe(
          'https://api.example.com/users?filter[name]=john&filter[age][gte]=18&filter[active]=true&sort=name&limit=10'
        );
      });

      it('should serialize search query parameters', () => {
        const url = 'https://search.example.com';
        const params = {
          q: 'typescript tutorial',
          operator: 'AND',
          fields: ['title', 'content', 'tags'],
          boost: { title: 2, tags: 1.5 },
        };
        expect(setQueryParams(url, params)).toBe(
          'https://search.example.com?q=typescript%20tutorial&operator=AND&fields[0]=title&fields[1]=content&fields[2]=tags&boost[title]=2&boost[tags]=1.5'
        );
      });

      it('should serialize complex nested OR conditions', () => {
        const url = 'https://api.example.com/search';
        const params = {
          where: {
            or: [
              { title: { contains: 'test' } },
              { description: { contains: 'test' } },
              { tags: { in: ['tag1', 'tag2'] } },
            ],
          },
          limit: 20,
        };
        expect(setQueryParams(url, params)).toBe(
          'https://api.example.com/search?where[or][0][title][contains]=test&where[or][1][description][contains]=test&where[or][2][tags][in][0]=tag1&where[or][2][tags][in][1]=tag2&limit=20'
        );
      });

      it('should handle pagination parameters', () => {
        const url = 'https://api.example.com/items';
        const params = {
          page: 2,
          per_page: 50,
          sort: '-created_at',
          include: ['author', 'comments'],
        };
        expect(setQueryParams(url, params)).toBe(
          'https://api.example.com/items?page=2&per_page=50&sort=-created_at&include[0]=author&include[1]=comments'
        );
      });
    });
  });

  describe('objectToQueryString', () => {
    it('should convert an object to a query string', () => {
      const obj = { a: 1, b: 2, c: { d: 3, e: 4 } };
      expect(objectToQueryString(obj)).toBe('a=1&b=2&c[d]=3&c[e]=4');
    });

    it('should encode the values if encodeURI is true', () => {
      const obj = { a: 'hello world', b: 'foo@bar.com' };
      expect(objectToQueryString(obj, true)).toBe(
        'a=hello%20world&b=foo%40bar.com'
      );
    });
  });

  describe('isUrl', () => {
    it('should return true for valid URLs', () => {
      expect(isUrl('http://example.com')).toBe(true);
      expect(isUrl('https://localhost:3000')).toBe(true);
      expect(isUrl('ftp://files.example.com')).toBe(true);
    });

    it('should return false for invalid URLs', () => {
      expect(isUrl(null as any)).toBe(false);
      expect(isUrl('')).toBe(false);
      expect(isUrl('not-a-valid-url')).toBe(false);
      expect(isUrl('http://256.256.256.256')).toBe(false);

      expect(isUrl('not-a-url')).toBe(false);
      expect(isUrl('http://')).toBe(false);
      expect(isUrl('https://.com')).toBe(true);
      expect(isUrl('')).toBe(false);
      expect(isUrl(null as any)).toBe(false);
      expect(isUrl(undefined as any)).toBe(false);
    });

    it('should return true for valid URLs', () => {
      expect(isUrl('https://example.com')).toBe(true);
      expect(isUrl('http://localhost:3000')).toBe(true);
      expect(isUrl('https://sub.domain.example.co.uk/path')).toBe(true);
      expect(isUrl('ftp://example.com')).toBe(true);
    });

    // Test Suite 1: Valid HTTP/HTTPS URLs (default behavior)
    describe('Valid HTTP/HTTPS URLs', () => {
      it('should return true for basic HTTP URL', () => {
        expect(isUrl('http://example.com')).toBe(true);
      });

      it('should return true for basic HTTPS URL', () => {
        expect(isUrl('https://example.com')).toBe(true);
      });

      it('should return true for URL with www subdomain', () => {
        expect(isUrl('https://www.example.com')).toBe(true);
      });

      it('should return true for URL with path', () => {
        expect(isUrl('https://example.com/path/to/resource')).toBe(true);
      });

      it('should return true for URL with query parameters', () => {
        expect(isUrl('https://example.com?key=value&foo=bar')).toBe(true);
      });

      it('should return true for URL with hash fragment', () => {
        expect(isUrl('https://example.com#section')).toBe(true);
      });

      it('should return true for URL with port', () => {
        expect(isUrl('https://example.com:8080')).toBe(true);
      });

      it('should return true for complex URL with all components', () => {
        expect(
          isUrl('https://user:pass@sub.example.com:8080/path?query=1#hash')
        ).toBe(true);
      });
    });

    // Test Suite 2: Valid URLs with different web protocols
    describe('Valid URLs with different web protocols', () => {
      it('should return true for FTP URL', () => {
        expect(isUrl('ftp://ftp.example.com')).toBe(true);
      });

      it('should return true for FTPS URL', () => {
        expect(isUrl('ftps://secure.example.com')).toBe(true);
      });

      it('should return true for WebSocket URL', () => {
        expect(isUrl('ws://example.com')).toBe(true);
      });

      it('should return true for secure WebSocket URL', () => {
        expect(isUrl('wss://example.com')).toBe(true);
      });
    });

    // Test Suite 3: Non-host protocols (rejected by default)
    describe('Non-host protocols with requireHost=true (default)', () => {
      it('should return false for mailto URL by default', () => {
        expect(isUrl('mailto:user@example.com')).toBe(false);
      });

      it('should return false for tel URL by default', () => {
        expect(isUrl('tel:+1234567890')).toBe(false);
      });

      it('should return false for data URI by default', () => {
        expect(isUrl('data:text/plain,hello')).toBe(false);
      });

      it('should return false for javascript protocol by default', () => {
        expect(isUrl('javascript:alert(1)')).toBe(false);
      });
    });

    // Test Suite 4: Non-host protocols with requireHost=false
    describe('Non-host protocols with requireHost=false', () => {
      it('should return true for mailto URL', () => {
        expect(isUrl('mailto:user@example.com', { requireHost: false })).toBe(
          true
        );
      });

      it('should return true for tel URL', () => {
        expect(isUrl('tel:+1234567890', { requireHost: false })).toBe(true);
      });

      it('should return true for data URI', () => {
        expect(isUrl('data:text/plain,hello', { requireHost: false })).toBe(
          true
        );
      });

      it('should return true for custom protocol', () => {
        expect(isUrl('customapp://action', { requireHost: false })).toBe(true);
      });
    });

    // Test Suite 5: Protocol filtering with allowedProtocols
    describe('Protocol filtering with allowedProtocols option', () => {
      it('should accept HTTPS when in allowed list', () => {
        expect(
          isUrl('https://example.com', { allowedProtocols: ['https'] })
        ).toBe(true);
      });

      it('should reject HTTP when not in allowed list', () => {
        expect(
          isUrl('http://example.com', { allowedProtocols: ['https'] })
        ).toBe(false);
      });

      it('should accept multiple allowed protocols', () => {
        expect(
          isUrl('http://example.com', { allowedProtocols: ['http', 'https'] })
        ).toBe(true);
        expect(
          isUrl('https://example.com', { allowedProtocols: ['http', 'https'] })
        ).toBe(true);
      });

      it('should work with non-host protocols when requireHost=false', () => {
        expect(
          isUrl('mailto:user@example.com', {
            requireHost: false,
            allowedProtocols: ['mailto', 'tel'],
          })
        ).toBe(true);
      });

      it('should reject non-host protocols not in allowed list', () => {
        expect(
          isUrl('data:text/plain,hello', {
            requireHost: false,
            allowedProtocols: ['mailto', 'tel'],
          })
        ).toBe(false);
      });
    });

    // Test Suite 6: Valid URLs with special domains
    describe('Valid URLs with special domains', () => {
      it('should return true for localhost', () => {
        expect(isUrl('http://localhost')).toBe(true);
      });

      it('should return true for localhost with port', () => {
        expect(isUrl('http://localhost:3000')).toBe(true);
      });

      it('should return true for IPv4 address', () => {
        expect(isUrl('http://192.168.1.1')).toBe(true);
      });

      it('should return true for IPv6 address', () => {
        expect(isUrl('http://[2001:db8::1]')).toBe(true);
      });
    });

    // Test Suite 7: Invalid URLs - Missing protocol
    describe('Invalid URLs - Missing protocol', () => {
      it('should return false for URL without protocol', () => {
        expect(isUrl('example.com')).toBe(false);
      });

      it('should return false for URL with www but no protocol', () => {
        expect(isUrl('www.example.com')).toBe(false);
      });

      it('should return false for URL starting with //', () => {
        expect(isUrl('//example.com')).toBe(false);
      });
    });

    // Test Suite 8: Invalid URLs - Malformed
    describe('Invalid URLs - Malformed', () => {
      it('should return false for URL with spaces in domain', () => {
        expect(isUrl('https://example .com')).toBe(false);
      });

      it('should return false for incomplete URL', () => {
        expect(isUrl('https://')).toBe(false);
      });

      it('should return false for URL without domain when host required', () => {
        expect(isUrl('https:///path')).toBe(false);
      });
    });

    // Test Suite 9: Edge cases
    describe('Edge cases', () => {
      it('should return false for empty string', () => {
        expect(isUrl('')).toBe(false);
      });

      it('should return false for whitespace only', () => {
        expect(isUrl('   ')).toBe(false);
      });

      it('should return false for non-string input (number)', () => {
        expect(isUrl(123 as any)).toBe(false);
      });

      it('should return false for non-string input (null)', () => {
        expect(isUrl(null as any)).toBe(false);
      });

      it('should return false for non-string input (undefined)', () => {
        expect(isUrl(undefined as any)).toBe(false);
      });

      it('should handle URL with trailing whitespace', () => {
        expect(isUrl('https://example.com  ')).toBe(true);
      });
    });
  });

  describe('isUriEncoded', () => {
    describe('Basic encoded strings', () => {
      it('should return true for strings encoded with encodeURIComponent', () => {
        expect(isUriEncoded('hello%20world')).toBe(true);
        expect(isUriEncoded('foo%2Bbar')).toBe(true);
        expect(isUriEncoded('test%3Dvalue')).toBe(true);
        expect(isUriEncoded('path%2Fto%2Ffile')).toBe(true);
        expect(isUriEncoded('query%3Fkey%3Dvalue')).toBe(true);
        expect(isUriEncoded('https%3A%2F%2Fexample.com%2Fpath')).toBe(true);
        expect(isUriEncoded('user%40example.com')).toBe(true);
      });

      it('should detect encoding of all special characters', () => {
        // Characters that encodeURIComponent encodes
        expect(isUriEncoded('space%20here')).toBe(true);
        expect(isUriEncoded('plus%2Bsign')).toBe(true);
        expect(isUriEncoded('equals%3Dsign')).toBe(true);
        expect(isUriEncoded('ampersand%26symbol')).toBe(true);
        expect(isUriEncoded('hash%23tag')).toBe(true);
        expect(isUriEncoded('question%3Fmark')).toBe(true);
        expect(isUriEncoded('colon%3Asemicolon%3B')).toBe(true);
        expect(isUriEncoded('less%3Cgreater%3E')).toBe(true);
        expect(isUriEncoded('square%5Bbracket%5D')).toBe(true);
        expect(isUriEncoded('curly%7Bbrace%7D')).toBe(true);
        expect(isUriEncoded('pipe%7Csymbol')).toBe(true);
        expect(isUriEncoded('backslash%5Cescape')).toBe(true);
        expect(isUriEncoded('caret%5Ehat')).toBe(true);
        expect(isUriEncoded('backtick%60grave')).toBe(true);
        expect(isUriEncoded('quote%22marks%27')).toBe(true);
      });
    });

    describe('Unencoded strings', () => {
      it('should return false for unencoded strings', () => {
        expect(isUriEncoded('hello world')).toBe(false);
        expect(isUriEncoded('foo+bar')).toBe(false);
        expect(isUriEncoded('test=value')).toBe(false);
        expect(isUriEncoded('path/to/file')).toBe(false);
        expect(isUriEncoded('query?key=value')).toBe(false);
        expect(isUriEncoded('https://example.com/path')).toBe(false);
        expect(isUriEncoded('user@example.com')).toBe(false);
        expect(isUriEncoded('normal-string')).toBe(false);
      });

      it('should return false for strings with natural percent signs', () => {
        expect(isUriEncoded('100%')).toBe(false);
        expect(isUriEncoded('50% off')).toBe(false);
        expect(isUriEncoded('90% complete')).toBe(false);
        expect(isUriEncoded('file%name.txt')).toBe(false);
        expect(isUriEncoded('test%case')).toBe(false);
      });
    });

    describe('Invalid percent encoding', () => {
      it('should return false for strings with invalid percent encoding', () => {
        expect(isUriEncoded('hello%XXworld')).toBe(false);
        expect(isUriEncoded('test%')).toBe(false);
        expect(isUriEncoded('%')).toBe(false);
        expect(isUriEncoded('100%')).toBe(false);
        expect(isUriEncoded('hello%G0world')).toBe(false);
        expect(isUriEncoded('test%ZZvalue')).toBe(false);
        expect(isUriEncoded('%1')).toBe(false);
        expect(isUriEncoded('%XY')).toBe(false);
        expect(isUriEncoded('start%')).toBe(false);
        expect(isUriEncoded('%end')).toBe(false);
        expect(isUriEncoded('%%')).toBe(false);
      });

      it('should return false for incomplete percent sequences', () => {
        expect(isUriEncoded('hello%2')).toBe(false);
        expect(isUriEncoded('test%A')).toBe(false);
        expect(isUriEncoded('%F')).toBe(false);
        expect(isUriEncoded('value%3')).toBe(false);
      });
    });

    describe('Input validation', () => {
      it('should return false for non-string inputs', () => {
        expect(isUriEncoded(null)).toBe(false);
        expect(isUriEncoded(undefined)).toBe(false);
        expect(isUriEncoded(123)).toBe(false);
        expect(isUriEncoded(0)).toBe(false);
        expect(isUriEncoded(true)).toBe(false);
        expect(isUriEncoded(false)).toBe(false);
        expect(isUriEncoded({})).toBe(false);
        expect(isUriEncoded([])).toBe(false);
        expect(isUriEncoded(() => {})).toBe(false);
        expect(isUriEncoded(new Date())).toBe(false);
      });

      it('should handle empty and whitespace strings', () => {
        expect(isUriEncoded('')).toBe(false);
        expect(isUriEncoded('   ')).toBe(false);
        expect(isUriEncoded('\t\n')).toBe(false);
      });
    });

    describe('Edge cases and special scenarios', () => {
      it('should handle single encoded characters', () => {
        expect(isUriEncoded('%20')).toBe(true); // Just a space
        expect(isUriEncoded('%2B')).toBe(true); // Just a plus
        expect(isUriEncoded('%3D')).toBe(true); // Just an equals
        expect(isUriEncoded('%40')).toBe(true); // Just an at symbol
      });

      it('should handle multiple encoded sequences', () => {
        expect(isUriEncoded('a%20b%20c')).toBe(true); // Multiple encoded spaces
        expect(isUriEncoded('hello%20world%21')).toBe(true); // Space and exclamation
        expect(isUriEncoded('%3Cdiv%3E%20content%20%3C%2Fdiv%3E')).toBe(true); // HTML-like
      });

      it('should handle encoded percent signs', () => {
        expect(isUriEncoded('100%25')).toBe(true); // Encoded percent sign
        expect(isUriEncoded('50%25%20off')).toBe(true); // Encoded percent and space
      });

      it('should handle mixed encoded and unencoded content', () => {
        expect(isUriEncoded('hello%20world!')).toBe(true); // Mixed
        expect(isUriEncoded('user%40domain.com/path')).toBe(true); // Mixed with slashes
        expect(isUriEncoded('query%3Dvalue&other=normal')).toBe(true); // Mixed in query
      });
    });

    describe('Double and multiple encoding', () => {
      it('should detect double encoding', () => {
        // Single encoded: "hello world" -> "hello%20world"
        expect(isUriEncoded('hello%20world')).toBe(true);

        // Double encoded: "hello%20world" -> "hello%2520world"
        expect(isUriEncoded('hello%2520world')).toBe(true);

        // Triple encoded would be: "hello%252520world"
        expect(isUriEncoded('hello%252520world')).toBe(true);
      });

      it('should handle complex double encoding scenarios', () => {
        expect(isUriEncoded('path%252Fto%252Ffile')).toBe(true);
        expect(isUriEncoded('user%2540domain.com')).toBe(true);
        expect(isUriEncoded('query%253Dvalue%2526other%253Dtest')).toBe(true);
      });
    });

    describe('Real-world URL scenarios', () => {
      it('should handle encoded URL components', () => {
        expect(
          isUriEncoded('https%3A%2F%2Fexample.com%2Fpath%20with%20spaces')
        ).toBe(true);
        expect(isUriEncoded('user%40example.com%3Apassword%40server.com')).toBe(
          true
        );
        expect(isUriEncoded('%2Fabsolute%2Fpath%2Fto%2Ffile.txt')).toBe(true);
      });

      it('should handle encoded query parameters', () => {
        expect(isUriEncoded('key1%3Dvalue1%26key2%3Dvalue2')).toBe(true);
        expect(isUriEncoded('search%3Dhello%20world%26filter%3Dactive')).toBe(
          true
        );
        expect(isUriEncoded('redirect%3Dhttps%253A%252F%252Fexample.com')).toBe(
          true
        );
      });

      it('should handle complex API URLs with nested encoded parameters', () => {
        // Real-world example: Payload CMS API URL with complex where clauses
        const complexApiUrl =
          'http://localhost:3000/api/collection/members?depth=2&limit=100&select%5Bid%5D=true&select%5BmembershipType%5D=true&select%5Buser%5D=true&where%5Bor%5D%5B%5D%5Bid%5D%5Bcontains%5D=ccgm&where%5Bor%5D%5B%5D%5Buser.firstName%5D%5Bcontains%5D=ccgm&where%5Bor%5D%5B%5D%5Buser.lastName%5D%5Bcontains%5D=ccgm';
        expect(isUriEncoded(complexApiUrl)).toBe(true);

        // Test just the query string part (everything after ?)
        const queryString =
          'depth=2&limit=100&select%5Bid%5D=true&select%5BmembershipType%5D=true&select%5Buser%5D=true&where%5Bor%5D%5B%5D%5Bid%5D%5Bcontains%5D=ccgm&where%5Bor%5D%5B%5D%5Buser.firstName%5D%5Bcontains%5D=ccgm&where%5Bor%5D%5B%5D%5Buser.lastName%5D%5Bcontains%5D=ccgm';
        expect(isUriEncoded(queryString)).toBe(true);

        // Test individual encoded components
        expect(isUriEncoded('select%5Bid%5D=true')).toBe(true);
        expect(
          isUriEncoded('where%5Bor%5D%5B%5D%5Bid%5D%5Bcontains%5D=ccgm')
        ).toBe(true);
        expect(isUriEncoded('user.firstName%5D%5Bcontains%5D')).toBe(true);
      });

      it('should handle encoded path segments', () => {
        expect(isUriEncoded('folder%2Fsubfolder%2Ffile%20name.txt')).toBe(true);
        expect(isUriEncoded('user%40host%3Aport%2Fpath')).toBe(true);
        expect(isUriEncoded('%7B%22key%22%3A%22value%22%7D')).toBe(true); // JSON-like
      });
    });

    describe('Unicode and international characters', () => {
      it('should handle encoded Unicode characters', () => {
        expect(isUriEncoded('caf%C3%A9')).toBe(true); // café
        expect(isUriEncoded('na%C3%AFve')).toBe(true); // naïve
        expect(isUriEncoded('%E4%BD%A0%E5%A5%BD')).toBe(true); // 你好 (Chinese)
        expect(isUriEncoded('%D0%9F%D1%80%D0%B8%D0%B2%D0%B5%D1%82')).toBe(true); // Привет (Russian)
      });

      it('should return false for unencoded Unicode', () => {
        expect(isUriEncoded('café')).toBe(false);
        expect(isUriEncoded('naïve')).toBe(false);
        expect(isUriEncoded('你好')).toBe(false);
        expect(isUriEncoded('Привет')).toBe(false);
      });
    });

    describe('Performance and boundary cases', () => {
      it('should handle very long strings', () => {
        const longEncoded = 'a%20'.repeat(1000) + 'z'; // 1000 encoded spaces
        const longUnencoded = 'a '.repeat(1000) + 'z'; // 1000 unencoded spaces

        expect(isUriEncoded(longEncoded)).toBe(true);
        expect(isUriEncoded(longUnencoded)).toBe(false);
      });

      it('should handle strings with many percent signs', () => {
        const manyPercents = '10%20%30%40%50%60%70%80%90%100%';
        expect(isUriEncoded(manyPercents)).toBe(false); // Invalid encodings
      });

      it('should handle alternating encoded/unencoded', () => {
        expect(isUriEncoded('hello%20world%21normal')).toBe(true);
        expect(isUriEncoded('normal%20text%21more')).toBe(true);
      });
    });

    describe('Special character combinations', () => {
      it('should handle URL-reserved characters', () => {
        expect(isUriEncoded('%3A%2F%2F%3F%23%5B%5D%40')).toBe(true); // :/?#[]@
        expect(isUriEncoded('%21%24%26%27%28%29%2A%2B%2C%3B%3D')).toBe(true); // !$&'()*+,;=
        expect(isUriEncoded('%25%2D%2E%5F%7E')).toBe(true); // %-._
      });

      it('should handle encoded whitespace variations', () => {
        expect(isUriEncoded('line%0Abreak')).toBe(true); // \n
        expect(isUriEncoded('tab%09character')).toBe(true); // \t
        expect(isUriEncoded('carriage%0Dreturn')).toBe(true); // \r
        expect(isUriEncoded('form%0Cfeed')).toBe(true); // \f
        expect(isUriEncoded('vertical%0Btab')).toBe(true); // \v
      });
    });

    describe('False positive prevention', () => {
      it('should not be fooled by percent-like patterns', () => {
        expect(isUriEncoded('100%')).toBe(false);
        expect(isUriEncoded('50.5%')).toBe(false);
        expect(isUriEncoded('test%case')).toBe(false);
        expect(isUriEncoded('file%name.txt')).toBe(false);
        expect(isUriEncoded('100%25%')).toBe(false); // Mixed valid/invalid
      });

      it('should distinguish between similar characters', () => {
        expect(isUriEncoded('hello%20world')).toBe(true); // %20 = space
        expect(isUriEncoded('hello%2Oworld')).toBe(false); // %2O = invalid (O not hex)
        expect(isUriEncoded('hello%2Gworld')).toBe(false); // %2G = invalid (G not hex)
      });
    });

    describe('Round-trip conversion', () => {
      it('should correctly round-trip complex objects with OR conditions', () => {
        const testObj = {
          limit: 100,
          id: 12,
          where: {
            or: [
              {
                id: {
                  contains: 'ccg',
                },
              },
              {
                'user.firstName': {
                  contains: 'ccg',
                },
              },
              {
                'user.lastName': {
                  contains: 'ccg',
                },
              },
            ],
          },
        };

        // Convert object to URL
        const url = setQueryParams('http://example.com', testObj);

        // Parse URL back to object
        const parsed = getQueryParams(url);

        // The parsed object should match the original (with string/number conversions)
        expect(parsed.limit).toBe('100');
        expect(parsed.id).toBe('12');
        expect(parsed.where.or).toHaveLength(3);
        expect(parsed.where.or[0]).toEqual({ id: { contains: 'ccg' } });
        expect(parsed.where.or[1]).toEqual({
          'user.firstName': { contains: 'ccg' },
        });
        expect(parsed.where.or[2]).toEqual({
          'user.lastName': { contains: 'ccg' },
        });
      });

      describe('Round-trip conversion scenarios', () => {
        it('should round-trip simple key-value pairs', () => {
          const original = { name: 'john', age: 30, active: true };
          const url = setQueryParams('https://example.com', original);
          const parsed = getQueryParams(url);
          expect(parsed).toEqual({ name: 'john', age: '30', active: 'true' });
        });

        it('should round-trip arrays', () => {
          const original = { tags: ['red', 'blue', 'green'] };
          const url = setQueryParams('https://example.com', original);
          const parsed = getQueryParams(url);
          expect(parsed).toEqual({ tags: ['red', 'blue', 'green'] });
        });

        it('should round-trip nested objects', () => {
          const original = {
            user: {
              profile: { name: 'john', email: 'john@example.com' },
              settings: { theme: 'dark', notifications: true },
            },
          };
          const url = setQueryParams('https://example.com', original);
          const parsed = getQueryParams(url);
          expect(parsed).toEqual({
            user: {
              profile: { name: 'john', email: 'john@example.com' },
              settings: { theme: 'dark', notifications: 'true' },
            },
          });
        });

        it('should round-trip complex API queries', () => {
          const original = {
            filter: {
              status: 'active',
              category: { in: ['tech', 'business'] },
              date: { gte: '2023-01-01' },
            },
            sort: '-created_at',
            limit: 50,
            include: ['author', 'comments'],
          };
          const url = setQueryParams('https://api.example.com/posts', original);
          const parsed = getQueryParams(url);
          expect(parsed).toEqual({
            filter: {
              status: 'active',
              category: { in: ['tech', 'business'] },
              date: { gte: '2023-01-01' },
            },
            sort: '-created_at',
            limit: '50',
            include: ['author', 'comments'],
          });
        });

        it('should round-trip with special characters', () => {
          const original = {
            query: 'hello world & more',
            email: 'user@example.com',
            tags: ['tag with spaces', 'special@tag'],
          };
          const url = setQueryParams('https://example.com', original);
          const parsed = getQueryParams(url);
          expect(parsed).toEqual({
            query: 'hello world & more',
            email: 'user@example.com',
            tags: ['tag with spaces', 'special@tag'],
          });
        });

        it('should round-trip with null and undefined values', () => {
          const original = { name: 'john', age: null, active: undefined };
          const url = setQueryParams('https://example.com', original);
          const parsed = getQueryParams(url);
          expect(parsed).toEqual({ name: 'john', age: '' });
        });

        it('should round-trip sparse arrays', () => {
          const original: { items: (string | undefined)[] } = { items: [] };
          original.items[0] = 'first';
          original.items[2] = 'third';
          const url = setQueryParams('https://example.com', original);
          const parsed = getQueryParams(url);
          expect(parsed).toEqual({ items: ['first', undefined, 'third'] });
        });
      });

      describe('Parsing complex encoded query strings', () => {
        it('should parse deeply encoded query strings', () => {
          // Simulate a query string that has been double-encoded
          const encodedQuery =
            'where%5Bor%5D%5B0%5D%5Btitle%5D%5Bcontains%5D=test&where%5Bor%5D%5B1%5D%5Bdescription%5D%5Bcontains%5D=test';
          const url = `https://api.example.com?${encodedQuery}`;
          const parsed = getQueryParams(url);
          expect(parsed).toEqual({
            where: {
              or: [
                { title: { contains: 'test' } },
                { description: { contains: 'test' } },
              ],
            },
          });
        });

        it('should handle query strings with mixed encoding levels', () => {
          const url =
            'https://example.com?simple=value&encoded=hello%20world&complex%5Bnested%5D%5Bkey%5D=encoded%20value';
          const parsed = getQueryParams(url);
          expect(parsed).toEqual({
            simple: 'value',
            encoded: 'hello world',
            complex: { nested: { key: 'encoded value' } },
          });
        });

        it('should parse query strings with array indices and brackets', () => {
          const url =
            'https://example.com?filters[0][field]=status&filters[0][value]=active&filters[1][field]=category&filters[1][value]=tech';
          const parsed = getQueryParams(url);
          expect(parsed).toEqual({
            filters: [
              { field: 'status', value: 'active' },
              { field: 'category', value: 'tech' },
            ],
          });
        });

        it('should handle query strings with empty brackets', () => {
          const url = 'https://example.com?tags[]=&tags[]=red&tags[]=';
          const parsed = getQueryParams(url);
          expect(parsed).toEqual({ tags: ['', 'red', ''] });
        });

        it('should parse complex filter expressions', () => {
          const url =
            'https://api.example.com/search?q=typescript&filters[and][0][tags][in][]=javascript&filters[and][0][tags][in][]=programming&filters[and][1][level]=beginner&sort[rating]=desc&limit=20';
          const parsed = getQueryParams(url);
          expect(parsed).toEqual({
            q: 'typescript',
            filters: {
              and: [
                { tags: { in: ['javascript', 'programming'] } },
                { level: 'beginner' },
              ],
            },
            sort: { rating: 'desc' },
            limit: '20',
          });
        });

        it('should handle query strings with date ranges and comparisons', () => {
          const url =
            'https://api.example.com/events?date[gte]=2023-01-01&date[lte]=2023-12-31&price[lt]=100&category[in][]=conference&category[in][]=workshop';
          const parsed = getQueryParams(url);
          expect(parsed).toEqual({
            date: { gte: '2023-01-01', lte: '2023-12-31' },
            price: { lt: '100' },
            category: { in: ['conference', 'workshop'] },
          });
        });

        it('should parse query strings with nested array operations', () => {
          const url =
            'https://api.example.com/products?where[or][0][and][0][price][gt]=10&where[or][0][and][1][price][lt]=100&where[or][1][category]=electronics&limit=50';
          const parsed = getQueryParams(url);
          expect(parsed).toEqual({
            where: {
              or: [
                {
                  and: [
                    { price: { '[gt]': '10' } },
                    { price: { '[lt]': '100' } },
                  ],
                },
                { category: 'electronics' },
              ],
            },
            limit: '50',
          });
        });
      });

      describe('Edge cases in parsing', () => {
        it('should handle URLs with only query parameters', () => {
          const url = '?a=1&b=2&c[0]=test';
          const parsed = getQueryParams(url);
          expect(parsed).toEqual({ a: '1', b: '2', c: ['test'] });
        });

        it('should handle query strings with leading/trailing ampersands', () => {
          const url = 'https://example.com?&a=1&&b=2&c=&';
          const parsed = getQueryParams(url);
          expect(parsed).toEqual({ a: '1', b: '2', c: '' });
        });

        it('should handle malformed bracket notation', () => {
          const url = 'https://example.com?a[=1&b]=2&c[=]&d[]=';
          const parsed = getQueryParams(url);
          expect(parsed).toEqual({ 'a[': '1', 'b]': '2', 'c[': ']', d: [''] });
        });

        it('should handle extremely nested structures', () => {
          const url =
            'https://example.com?data[a][b][c][d][e]=value&data[a][b][c][f]=another';
          const parsed = getQueryParams(url);
          expect(parsed).toEqual({
            data: {
              a: {
                b: {
                  c: {
                    d: { e: 'value' },
                    f: 'another',
                  },
                },
              },
            },
          });
        });

        it('should handle query strings with hash fragments', () => {
          const url = 'https://example.com?a=1&b=2#section?param=value';
          const parsed = getQueryParams(url);
          expect(parsed).toEqual({ a: '1', b: '2' });
        });

        it('should handle very long query strings', () => {
          const longValue = 'a'.repeat(1000);
          const url = `https://example.com?data=${longValue}`;
          const parsed = getQueryParams(url);
          expect(parsed.data).toBe(longValue);
        });
      });
    });
  });
});

describe('isDataUrl', () => {
  // Test Suite 1: Valid Data URLs - Basic formats
  describe('Valid Data URLs - Basic formats', () => {
    it('should return true for simple text Data URL', () => {
      expect(isDataUrl('data:,Hello%2C%20World!')).toBe(true);
    });

    it('should return true for text/plain Data URL', () => {
      expect(isDataUrl('data:text/plain,Hello')).toBe(true);
    });

    it('should return true for text/plain with spaces (URL encoded)', () => {
      expect(isDataUrl('data:text/plain,Hello%20World')).toBe(true);
    });

    it('should return true for text/html Data URL', () => {
      expect(isDataUrl('data:text/html,<h1>Hello</h1>')).toBe(true);
    });

    it('should return true for Data URL with charset', () => {
      expect(isDataUrl('data:text/plain;charset=UTF-8,Hello')).toBe(true);
    });
  });

  // Test Suite 2: Valid Data URLs - Base64 encoded
  describe('Valid Data URLs - Base64 encoded', () => {
    it('should return true for base64 encoded text', () => {
      expect(isDataUrl('data:text/plain;base64,SGVsbG8gV29ybGQ=')).toBe(true);
    });

    it('should return true for base64 encoded image', () => {
      expect(
        isDataUrl(
          'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
        )
      ).toBe(true);
    });

    it('should return true for base64 with no padding', () => {
      expect(isDataUrl('data:text/plain;base64,SGVsbG8')).toBe(true);
    });

    it('should return true for base64 with single padding', () => {
      expect(isDataUrl('data:text/plain;base64,SGVsbA==')).toBe(true);
    });

    it('should return true for base64 with double padding', () => {
      expect(isDataUrl('data:text/plain;base64,SGk=')).toBe(true);
    });
  });

  // Test Suite 3: Valid Data URLs - Various MIME types
  describe('Valid Data URLs - Various MIME types', () => {
    it('should return true for image/jpeg', () => {
      expect(isDataUrl('data:image/jpeg;base64,/9j/4AAQ')).toBe(true);
    });

    it('should return true for image/svg+xml', () => {
      expect(
        isDataUrl(
          'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"></svg>'
        )
      ).toBe(true);
    });

    it('should return true for application/json', () => {
      expect(isDataUrl('data:application/json,{"key":"value"}')).toBe(true);
    });

    it('should return true for application/pdf', () => {
      expect(isDataUrl('data:application/pdf;base64,JVBERi0xLjM=')).toBe(true);
    });

    it('should return true for audio/mpeg', () => {
      expect(isDataUrl('data:audio/mpeg;base64,SUQz')).toBe(true);
    });
  });

  // Test Suite 4: MIME type filtering
  describe('MIME type filtering with allowedMimeTypes', () => {
    it('should accept allowed MIME type', () => {
      expect(
        isDataUrl('data:image/png;base64,ABC', {
          allowedMimeTypes: ['image/png'],
        })
      ).toBe(true);
    });

    it('should reject non-allowed MIME type', () => {
      expect(
        isDataUrl('data:text/plain,Hello', { allowedMimeTypes: ['image/png'] })
      ).toBe(false);
    });

    it('should accept multiple allowed MIME types', () => {
      expect(
        isDataUrl('data:image/jpeg;base64,ABC', {
          allowedMimeTypes: ['image/png', 'image/jpeg'],
        })
      ).toBe(true);
    });

    it('should be case-insensitive for MIME types', () => {
      expect(
        isDataUrl('data:IMAGE/PNG;base64,ABC', {
          allowedMimeTypes: ['image/png'],
        })
      ).toBe(true);
    });

    it('should handle default MIME type with allowedMimeTypes', () => {
      expect(
        isDataUrl('data:,Hello', { allowedMimeTypes: ['text/plain'] })
      ).toBe(true);
    });
  });

  // Test Suite 5: Base64 requirement option
  describe('Base64 requirement with requireBase64 option', () => {
    it('should accept base64 when required', () => {
      expect(
        isDataUrl('data:text/plain;base64,SGVsbG8=', { requireBase64: true })
      ).toBe(true);
    });

    it('should reject non-base64 when required', () => {
      expect(isDataUrl('data:text/plain,Hello', { requireBase64: true })).toBe(
        false
      );
    });

    it('should accept both when not required', () => {
      expect(isDataUrl('data:text/plain;base64,SGVsbG8=')).toBe(true);
      expect(isDataUrl('data:text/plain,Hello')).toBe(true);
    });
  });

  // Test Suite 6: Base64 validation option
  describe('Base64 validation with validateBase64 option', () => {
    it('should accept valid base64', () => {
      expect(
        isDataUrl('data:text/plain;base64,SGVsbG8=', { validateBase64: true })
      ).toBe(true);
    });

    it('should reject invalid base64 characters', () => {
      expect(
        isDataUrl('data:text/plain;base64,Hello!!!', { validateBase64: true })
      ).toBe(false);
    });

    it('should reject base64 with invalid length', () => {
      expect(
        isDataUrl('data:text/plain;base64,SGVsb', { validateBase64: true })
      ).toBe(false);
    });

    it('should reject base64 with excessive padding', () => {
      expect(
        isDataUrl('data:text/plain;base64,SGVs===', { validateBase64: true })
      ).toBe(false);
    });

    it('should reject base64 with misplaced padding', () => {
      expect(
        isDataUrl('data:text/plain;base64,SG=sbG8=', { validateBase64: true })
      ).toBe(false);
    });

    it('should not validate non-base64 data', () => {
      expect(
        isDataUrl('data:text/plain,Invalid!!!', { validateBase64: true })
      ).toBe(true);
    });
  });

  // Test Suite 7: Invalid Data URLs - Wrong protocol
  describe('Invalid Data URLs - Wrong protocol', () => {
    it('should return false for http URL', () => {
      expect(isDataUrl('http://example.com')).toBe(false);
    });

    it('should return false for missing protocol', () => {
      expect(isDataUrl('text/plain,Hello')).toBe(false);
    });

    it('should return false for wrong protocol', () => {
      expect(isDataUrl('file:text/plain,Hello')).toBe(false);
    });
  });

  // Test Suite 8: Invalid Data URLs - Malformed
  describe('Invalid Data URLs - Malformed', () => {
    it('should return false for Data URL without comma', () => {
      expect(isDataUrl('data:text/plain')).toBe(false);
    });

    it('should return false for Data URL with empty data', () => {
      expect(isDataUrl('data:text/plain,')).toBe(false);
    });

    it('should return false for invalid MIME type format', () => {
      expect(isDataUrl('data:invalid-mime,Hello')).toBe(false);
    });

    it('should return false for MIME type with spaces', () => {
      expect(isDataUrl('data:text /plain,Hello')).toBe(false);
    });
  });

  // Test Suite 9: Edge cases
  describe('Edge cases', () => {
    it('should return false for empty string', () => {
      expect(isDataUrl('')).toBe(false);
    });

    it('should return false for whitespace only', () => {
      expect(isDataUrl('   ')).toBe(false);
    });

    it('should return false for non-string input (number)', () => {
      expect(isDataUrl(123 as any)).toBe(false);
    });

    it('should return false for non-string input (null)', () => {
      expect(isDataUrl(null as any)).toBe(false);
    });

    it('should return false for non-string input (undefined)', () => {
      expect(isDataUrl(undefined as any)).toBe(false);
    });

    it('should handle Data URL with trailing whitespace', () => {
      expect(isDataUrl('data:text/plain,Hello  ')).toBe(true);
    });

    it('should handle very long base64 data', () => {
      const longData = 'A'.repeat(10000);
      expect(isDataUrl(`data:text/plain;base64,${longData}`)).toBe(true);
    });
  });
});
describe('isDataUrl', () => {
  it('should return true for valid data URLs', () => {
    expect(
      isDataUrl('data:image/jpeg;base64,abc123', { validateBase64: true })
    ).toBe(false);
    expect(
      isDataUrl('data:text/plain,Hello%20World', { validateBase64: true })
    ).toBe(false);
    expect(
      isDataUrl('data:application/json;base64,eyJhIjoxfQ==', {
        validateBase64: true,
      })
    ).toBe(false);
  });

  it('should return false for invalid data URLs', () => {
    expect(isDataUrl('data:')).toBe(false);
    expect(isDataUrl('data:image/x-icon;base64,abc123')).toBe(false);
    expect(isDataUrl('https://example.com/image.jpg')).toBe(false);
    expect(isDataUrl('')).toBe(false);
  });
});

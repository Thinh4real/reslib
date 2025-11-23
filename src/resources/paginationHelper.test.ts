import "../utils";
import { ResourcePaginationHelper } from "./ResourcePaginationHelper";

describe("ResourcePaginationHelper", () => {
  describe("getPaginationMetaData", () => {
    it("should return correct metadata for valid pagination options", () => {
      const count = 100;
      const queryOptions = { limit: 10, page: 2 };
      const meta = ResourcePaginationHelper.getPaginationMetaData(
        count,
        queryOptions
      );

      expect(meta).toEqual({
        total: 100,
        currentPage: 2,
        pageSize: 10,
        totalPages: 10,
        hasNextPage: true,
        hasPreviousPage: true,
        nextPage: 3,
        previousPage: 1,
        lastPage: 10,
      });
    });

    it("should handle cases where limit or page is not provided", () => {
      const count = 50;
      const queryOptions = {};
      const meta = ResourcePaginationHelper.getPaginationMetaData(
        count,
        queryOptions
      );

      expect(meta).toEqual({
        total: 50,
      });
    });

    it("should handle cases where count is not a number", () => {
      const count = null;
      const queryOptions = { limit: 10, page: 1 };
      const meta = ResourcePaginationHelper.getPaginationMetaData(
        count as any,
        queryOptions
      );

      expect(meta).toEqual({
        total: 0,
        currentPage: 1,
        pageSize: 10,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false,
        nextPage: undefined,
        previousPage: undefined,
        lastPage: 0,
      });
    });
  });

  describe("paginate", () => {
    it("should return paginated data with correct metadata", () => {
      const data = Array.from({ length: 100 }, (_, i) => ({ id: i + 1 }));
      const count = 100;
      const queryOptions = { limit: 10, page: 2 };
      const result = ResourcePaginationHelper.paginate(
        data,
        count,
        queryOptions
      );
      expect(result).toEqual({
        data: data.slice(10, 20),
        total: 100,
        meta: {
          total: 100,
          currentPage: 2,
          pageSize: 10,
          totalPages: 10,
          hasNextPage: true,
          hasPreviousPage: true,
          nextPage: 3,
          previousPage: 1,
          lastPage: 10,
        },
      });
    });

    it("should handle empty data arrays", () => {
      const data: any[] = [];
      const count = 0;
      const queryOptions = { limit: 10, page: 1 };

      const result = ResourcePaginationHelper.paginate(
        data,
        count,
        queryOptions
      );

      expect(result).toEqual({
        data: [],
        total: 0,
        meta: {
          total: 0,
          currentPage: 1,
          pageSize: 10,
          totalPages: 0,
          hasNextPage: false,
          hasPreviousPage: false,
          nextPage: undefined,
          previousPage: undefined,
          lastPage: 0,
        },
      });
    });

    it("should handle cases where pagination options are not provided", () => {
      const data = Array.from({ length: 50 }, (_, i) => ({ id: i + 1 }));
      const count = 50;
      const result = ResourcePaginationHelper.paginate(data, count);
      expect(result).toEqual({
        data,
        total: 50,
        meta: {
          total: 50,
        },
      });
    });
  });

  describe("normalizeOrderBy", () => {
    interface TestUser {
      id: number;
      name: string;
      profile: {
        age: number;
        address: {
          city: string;
          country: string;
        };
      };
      tags: string[];
      createdAt: Date;
    }

    it("should handle undefined input", () => {
      const result =
        ResourcePaginationHelper.normalizeOrderBy<TestUser>(undefined);
      expect(result).toEqual({});
    });

    it("should handle null input", () => {
      const result = ResourcePaginationHelper.normalizeOrderBy<TestUser>(
        null as any
      );
      expect(result).toEqual({});
    });

    it("should handle empty array input", () => {
      const result = ResourcePaginationHelper.normalizeOrderBy<TestUser>([]);
      expect(result).toEqual({});
    });

    it("should handle single ascending field as string", () => {
      const result =
        ResourcePaginationHelper.normalizeOrderBy<TestUser>("name");
      expect(result).toEqual({ name: "asc" });
    });

    it("should handle single descending field as string", () => {
      const result =
        ResourcePaginationHelper.normalizeOrderBy<TestUser>("-name");
      expect(result).toEqual({ name: "desc" });
    });

    it("should handle nested ascending field", () => {
      const result =
        ResourcePaginationHelper.normalizeOrderBy<TestUser>("profile.age");
      expect(result).toEqual({ "profile.age": "asc" });
    });

    it("should handle nested descending field", () => {
      const result = ResourcePaginationHelper.normalizeOrderBy<TestUser>(
        "-profile.address.city"
      );
      expect(result).toEqual({ "profile.address.city": "desc" });
    });

    it("should handle deeply nested field", () => {
      const result = ResourcePaginationHelper.normalizeOrderBy<TestUser>(
        "profile.address.country"
      );
      expect(result).toEqual({ "profile.address.country": "asc" });
    });

    it("should handle array with single field", () => {
      const result = ResourcePaginationHelper.normalizeOrderBy<TestUser>([
        "name",
      ]);
      expect(result).toEqual({ name: "asc" });
    });

    it("should handle array with multiple fields", () => {
      const result = ResourcePaginationHelper.normalizeOrderBy<TestUser>([
        "name",
        "-profile.age",
        "profile.address.city",
      ]);
      expect(result).toEqual({
        name: "asc",
        "profile.age": "desc",
        "profile.address.city": "asc",
      });
    });

    it("should handle array with mixed ascending and descending fields", () => {
      const result = ResourcePaginationHelper.normalizeOrderBy<TestUser>([
        "name",
        "-profile.age",
        "profile.address.city",
      ]);
      expect(result).toEqual({
        name: "asc",
        "profile.age": "desc",
        "profile.address.city": "asc",
      });
    });

    it("should filter out null values in array", () => {
      const result = ResourcePaginationHelper.normalizeOrderBy<TestUser>([
        "name",
        null as any,
        "-profile.age",
      ]);
      expect(result).toEqual({
        name: "asc",
        "profile.age": "desc",
      });
    });

    it("should filter out undefined values in array", () => {
      const result = ResourcePaginationHelper.normalizeOrderBy<TestUser>([
        "name",
        undefined as any,
        "-profile.age",
      ]);
      expect(result).toEqual({
        name: "asc",
        "profile.age": "desc",
      });
    });

    it("should filter out empty strings in array", () => {
      const result = ResourcePaginationHelper.normalizeOrderBy<TestUser>([
        "name",
        "" as any,
        "-profile.age",
      ]);
      expect(result).toEqual({
        name: "asc",
        "profile.age": "desc",
      });
    });

    it("should filter out whitespace-only strings in array", () => {
      const result = ResourcePaginationHelper.normalizeOrderBy<TestUser>([
        "name",
        "   " as any,
        "-profile.age",
      ]);
      expect(result).toEqual({
        name: "asc",
        "profile.age": "desc",
      });
    });

    it("should handle duplicate fields with warning (last one wins)", () => {
      const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation();

      const result = ResourcePaginationHelper.normalizeOrderBy<TestUser>([
        "name",
        "-name",
        "profile.age",
      ]);

      expect(result).toEqual({
        name: "desc",
        "profile.age": "asc",
      });

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        "Duplicate orderBy field: name. Using last occurrence."
      );

      consoleWarnSpy.mockRestore();
    });

    it("should handle multiple duplicates correctly", () => {
      const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation();

      const result = ResourcePaginationHelper.normalizeOrderBy<TestUser>([
        "name",
        "-name",
        "name",
        "-profile.age",
        "profile.age",
      ]);

      expect(result).toEqual({
        name: "asc",
        "profile.age": "asc",
      });

      expect(consoleWarnSpy).toHaveBeenCalledTimes(3);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        "Duplicate orderBy field: name. Using last occurrence."
      );
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        "Duplicate orderBy field: name. Using last occurrence."
      );
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        "Duplicate orderBy field: profile.age. Using last occurrence."
      );

      consoleWarnSpy.mockRestore();
    });

    it("should handle field starting with single dash", () => {
      const result = ResourcePaginationHelper.normalizeOrderBy<TestUser>(
        "-" as any
      );
      expect(result).toEqual({ "": "desc" });
    });

    it("should handle field that is just a dash", () => {
      const result = ResourcePaginationHelper.normalizeOrderBy<TestUser>(
        "-" as any
      );
      expect(result).toEqual({ "": "desc" });
    });

    it("should handle date field", () => {
      const result = ResourcePaginationHelper.normalizeOrderBy<TestUser>(
        "-createdAt" as any
      );
      expect(result).toEqual({ createdAt: "desc" });
    });

    it("should handle array input with mixed valid and invalid values", () => {
      const result = ResourcePaginationHelper.normalizeOrderBy<TestUser>([
        "name",
        null,
        "",
        "   ",
        undefined,
        "-profile.age",
        {},
        [],
        123,
      ] as any);

      expect(result).toEqual({
        name: "asc",
        "profile.age": "desc",
      });
    });

    it("should return empty object for array with only invalid values", () => {
      const result = ResourcePaginationHelper.normalizeOrderBy<TestUser>([
        null,
        "",
        undefined,
        {},
        [],
      ] as any);

      expect(result).toEqual({});
    });

    it("should handle very long field paths", () => {
      const longPath =
        "profile.address.country.code.region.city.district.street";
      const result = ResourcePaginationHelper.normalizeOrderBy<TestUser>(
        longPath as any
      );
      expect(result).toEqual({ [longPath]: "asc" });
    });

    it("should handle descending very long field paths", () => {
      const longPath =
        "profile.address.country.code.region.city.district.street";
      const result = ResourcePaginationHelper.normalizeOrderBy<TestUser>(
        `-${longPath}` as any
      );
      expect(result).toEqual({ [longPath]: "desc" });
    });
  });
});

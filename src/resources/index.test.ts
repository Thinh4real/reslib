import { Auth, IAuthUser } from "@/auth";
import { i18n } from "@/i18n";
import "../translations";
import { Resource, ResourceMeta } from "./index";
import {
  IField,
  IResource,
  IResourceDataService,
  IResourceName,
  IResourcePaginatedResult,
  IResourceQueryOptions,
} from "./types";

interface MockData {
  id: string;
  name: string;
  email: string;
  createdAt?: number;
  updatedAt?: number;
}

class MockDataService implements IResourceDataService<MockData, string> {
  private data: Map<string, MockData> = new Map();
  private nextId: number = 1;

  find(options?: IResourceQueryOptions<MockData>): Promise<MockData[]> {
    return Promise.resolve(Array.from(this.data.values()));
  }

  findOne(
    options: string | IResourceQueryOptions<MockData>
  ): Promise<MockData | null> {
    const id = typeof options === "string" ? options : (options as any).id;
    return Promise.resolve(this.data.get(id) || null);
  }

  findOneOrFail(
    options: string | IResourceQueryOptions<MockData>
  ): Promise<MockData> {
    const id = typeof options === "string" ? options : (options as any).id;
    const record = this.data.get(id);
    if (!record) return Promise.reject(new Error("Record not found"));
    return Promise.resolve(record);
  }

  create(record: Partial<MockData>): Promise<MockData> {
    const id = this.nextId.toString();
    const newRecord: MockData = {
      id,
      name: record.name || "",
      email: record.email || "",
      createdAt: Date.now(),
    };
    this.data.set(id, newRecord);
    this.nextId++;
    return Promise.resolve(newRecord);
  }

  update(primaryKey: string, data: Partial<MockData>): Promise<MockData> {
    const existing = this.data.get(primaryKey);
    if (!existing) return Promise.reject(new Error("Not found"));
    const updated = { ...existing, ...data, updatedAt: Date.now() };
    this.data.set(primaryKey, updated);
    return Promise.resolve(updated);
  }

  delete(primaryKey: string): Promise<boolean> {
    const existed = this.data.has(primaryKey);
    this.data.delete(primaryKey);
    return Promise.resolve(existed);
  }

  findAndCount(
    options?: IResourceQueryOptions<MockData>
  ): Promise<[MockData[], number]> {
    const data = Array.from(this.data.values());
    return Promise.resolve([data, data.length]);
  }

  findAndPaginate(
    options?: IResourceQueryOptions<MockData>
  ): Promise<IResourcePaginatedResult<MockData>> {
    const data = Array.from(this.data.values());
    return Promise.resolve({
      data,
      total: data.length,
      count: data.length,
    } as any);
  }

  createMany(data: Partial<MockData>[]): Promise<MockData[]> {
    return Promise.all(data.map((item) => this.create(item)));
  }

  updateMany(criteria: any, data: Partial<MockData>): Promise<number> {
    let count = 0;
    this.data.forEach((record) => {
      this.data.set(record.id, { ...record, ...data, updatedAt: Date.now() });
      count++;
    });
    return Promise.resolve(count);
  }

  deleteMany(criteria: any): Promise<number> {
    const count = this.data.size;
    this.data.clear();
    return Promise.resolve(count);
  }

  count(options?: IResourceQueryOptions<MockData>): Promise<number> {
    return Promise.resolve(this.data.size);
  }

  exists(primaryKey: string): Promise<boolean> {
    return Promise.resolve(this.data.has(primaryKey));
  }

  clear() {
    this.data.clear();
    this.nextId = 1;
  }

  getAll() {
    return Array.from(this.data.values());
  }
}

@ResourceMeta({
  name: "users" as IResourceName,
  label: "Users",
  title: "User Management",
  actions: {},
  instanciate: false,
})
class TestUserResource extends Resource<"users", MockData, string> {
  name: IResourceName = "users";
  label = "Users";
  title = "User Management";
  actions: Partial<any> = {};
  private mockDataService = new MockDataService();

  getDataService(): IResourceDataService<MockData, string> {
    return this.mockDataService;
  }

  clearData() {
    this.mockDataService.clear();
  }

  getAllData() {
    return this.mockDataService.getAll();
  }
}

describe("Resource Class", () => {
  let resource: TestUserResource;
  let adminUser: IAuthUser;

  beforeAll(() => {
    i18n.setLocale("en");
  });

  beforeEach(() => {
    resource = new TestUserResource();
    resource.clearData();
    Auth.setSignedUser(null, false);
    Auth.isMasterAdmin = undefined;
    Resource.events.offAll();
    adminUser = { id: "admin-1", perms: { users: ["all"] } };
  });

  afterEach(() => {
    resource.destroy();
  });

  describe("Metadata", () => {
    it("should have correct metadata", () => {
      expect(resource.name).toBe("users");
      expect(resource.label).toBe("Users");
    });

    it("should retrieve metadata", () => {
      const metadata = resource.getMetaData();
      expect(metadata).toBeDefined();
      expect(metadata.name).toBe("users");
    });

    it("should update metadata", () => {
      const newMetadata: IResource = {
        name: "users",
        label: "Updated",
        title: "Updated",
        actions: {},
      };
      const updated = resource.updateMetadata(newMetadata);
      expect(updated.label).toBe("Updated");
    });
  });

  describe("CRUD - Create", () => {
    beforeEach(() => {
      Auth.setSignedUser(adminUser, false);
    });

    it("should create record", async () => {
      const result = await resource.create({
        name: "John",
        email: "john@test.com",
      });
      expect(result.id).toBeDefined();
      expect(result.name).toBe("John");
    });

    it("should create multiple records", async () => {
      const results = await resource.createMany([
        { name: "John", email: "john@test.com" },
        { name: "Jane", email: "jane@test.com" },
      ]);
      expect(results).toHaveLength(2);
    });

    it("should reject unauthorized create", async () => {
      Auth.setSignedUser({ id: "user-1", perms: { users: ["read"] } }, false);
      await expect(
        resource.create({ name: "Test", email: "test@test.com" })
      ).rejects.toThrow();
    });
  });

  describe("CRUD - Read", () => {
    beforeEach(async () => {
      Auth.setSignedUser(adminUser, false);
      await resource.create({ name: "John", email: "john@test.com" });
      await resource.create({ name: "Jane", email: "jane@test.com" });
    });

    it("should find all", async () => {
      const result = await resource.find();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);
    });

    it("should find one", async () => {
      const all = resource.getAllData();
      const result = await resource.findOne(all[0].id);
      expect(result?.id).toBe(all[0].id);
    });

    it("should count", async () => {
      const count = await resource.count();
      expect(count).toBe(2);
    });

    it("should reject unauthorized read", async () => {
      Auth.setSignedUser({ id: "user-1", perms: { users: ["create"] } }, false);
      await expect(resource.find()).rejects.toThrow();
    });
  });

  describe("CRUD - Update", () => {
    beforeEach(async () => {
      Auth.setSignedUser(adminUser, false);
      await resource.create({ name: "John", email: "john@test.com" });
    });

    it("should update", async () => {
      const all = resource.getAllData();
      const result = await resource.update(all[0].id, { name: "Jane" });
      expect(result.name).toBe("Jane");
    });

    it("should reject unauthorized update", async () => {
      Auth.setSignedUser({ id: "user-1", perms: { users: ["read"] } }, false);
      const all = resource.getAllData();
      await expect(
        resource.update(all[0].id, { name: "Hacked" })
      ).rejects.toThrow();
    });
  });

  describe("CRUD - Delete", () => {
    beforeEach(async () => {
      Auth.setSignedUser(adminUser, false);
      await resource.create({ name: "John", email: "john@test.com" });
    });

    it("should delete", async () => {
      const all = resource.getAllData();
      const result = await resource.delete(all[0].id);
      expect(result).toBe(true);
    });

    it("should reject unauthorized delete", async () => {
      Auth.setSignedUser({ id: "user-1", perms: { users: ["read"] } }, false);
      const all = resource.getAllData();
      await expect(resource.delete(all[0].id)).rejects.toThrow();
    });
  });

  describe("Authorization", () => {
    it("should authorize read", async () => {
      Auth.setSignedUser({ id: "user-1", perms: { users: ["read"] } }, false);
      await expect(resource.authorizeAction("read")).resolves.toBeUndefined();
    });

    it("should reject unauthorized", async () => {
      Auth.setSignedUser({ id: "user-1", perms: { users: ["create"] } }, false);
      await expect(resource.authorizeAction("read")).rejects.toThrow();
    });
  });

  describe("Permissions", () => {
    it("should check canUserRead", () => {
      expect(resource.canUserRead(adminUser)).toBe(true);
      expect(
        resource.canUserRead({ id: "user-1", perms: { users: ["create"] } })
      ).toBe(false);
    });

    it("should check canUserCreate", () => {
      expect(resource.canUserCreate(adminUser)).toBe(true);
    });

    it("should check isAllowed", () => {
      expect(resource.isAllowed("read", adminUser)).toBe(true);
      expect(
        resource.isAllowed("read", {
          id: "user-1",
          perms: { users: ["delete"] },
        })
      ).toBe(false);
    });
  });

  describe("Actions", () => {
    it("should get actions", () => {
      const actions = resource.getActions();
      expect(typeof actions).toBe("object");
    });

    it("should check action exists", () => {
      resource.actions = {
        publish: { label: "Publish", title: "Publish action" },
      };
      expect(resource.hasAction("publish")).toBe(true);
      expect(resource.hasAction("delete")).toBe(false);
    });
  });

  describe("Fields", () => {
    it("should get fields", () => {
      const fields = resource.getFields();
      expect(typeof fields).toBe("object");
    });

    it("should get primary keys", () => {
      resource.fields = {
        id: { name: "id", primaryKey: true, type: "text" } as IField,
      };
      const keys = resource.getPrimaryKeys();
      expect(keys).toHaveLength(1);
    });
  });

  describe("Events", () => {
    it("should trigger event", () => {
      const spy = jest.fn();
      Resource.events.on("customEvent", spy);
      resource.trigger("customEvent" as any);
      expect(spy).toHaveBeenCalled();
    });

    it("should pass context", () => {
      const spy = jest.fn();
      Resource.events.on("find", spy);
      resource.trigger("find" as any);
      const arg = spy.mock.calls[0][0];
      expect(arg).toHaveProperty("resourceName");
    });
  });

  describe("Integration", () => {
    it("should complete CRUD workflow", async () => {
      Auth.setSignedUser(adminUser, false);
      const created = await resource.create({
        name: "Test",
        email: "test@test.com",
      });
      const found = await resource.findOne(created.id);
      expect(found?.name).toBe("Test");
      const updated = await resource.update(created.id, { name: "Updated" });
      expect(updated.name).toBe("Updated");
      const deleted = await resource.delete(created.id);
      expect(deleted).toBe(true);
    });
  });
});

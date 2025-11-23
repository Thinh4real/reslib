import "reflect-metadata";
import { buildPropertyDecorator, getDecoratedProperty } from ".";

describe("Will test decorators functions", () => {
  const Required = buildPropertyDecorator("required", true);
  const MaxLength = (max: number) =>
    buildPropertyDecorator<number>("maxLength", max);
  class User {
    @Required
    @MaxLength(200)
    name?: string = "";

    @Required
    email?: string;
  }

  class PartialUser extends User {
    @MaxLength(300)
    @Required
    name?: string = "";
    @MaxLength(100)
    description?: string;
  }
  it("should return the correct metadata for a property", () => {
    expect(getDecoratedProperty(User, "required", "name")).toBe(true);
    expect(getDecoratedProperty(PartialUser, "required", "name")).toBe(true);
    expect(getDecoratedProperty(User, "maxLength", "name")).toBe(200);
    expect(getDecoratedProperty(PartialUser, "maxLength", "description")).toBe(
      100
    );
    expect(getDecoratedProperty(PartialUser, "maxLength", "name")).toBe(300);
  });
});

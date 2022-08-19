import { PostgrestFilter } from "../src";

const MOCK = {
  id: 1,
  text: "some-text",
  array: ["element-1", "element-2"],
  date: new Date().toISOString(),
  boolean: false,
  some: {
    nested: {
      value: "test",
      array: [{ type: "a" }],
    },
  },
};

describe("PostgrestFilter", () => {
  describe(".apply", () => {
    it("with alias", () => {
      expect(
        new PostgrestFilter({
          filters: [
            {
              or: [
                {
                  path: "some_other_path",
                  alias: "text",
                  negate: false,
                  operator: "eq",
                  value: "some-text",
                },
              ],
            },
          ],
          paths: [
            { path: "text" },
            { path: "array" },
            { path: "some.nested.value" },
          ],
        }).apply(MOCK)
      ).toEqual(true);
    });
    it("or", () => {
      expect(
        new PostgrestFilter({
          filters: [
            {
              or: [
                {
                  path: "id",
                  negate: false,
                  operator: "eq",
                  value: 5,
                },
                {
                  path: "id",
                  negate: false,
                  operator: "eq",
                  value: 1,
                },
              ],
            },
          ],
          paths: [
            { path: "text" },
            { path: "array" },
            { path: "some.nested.value" },
          ],
        }).apply(MOCK)
      ).toEqual(true);
    });
    it("or with nested value and undefined path", () => {
      expect(
        new PostgrestFilter({
          filters: [
            {
              or: [
                {
                  path: "cities.name",
                  negate: false,
                  operator: "eq",
                  value: "Paris",
                },
                {
                  path: "some.nested.value",
                  negate: false,
                  operator: "eq",
                  value: "t",
                },
                {
                  path: "some.nested.value",
                  negate: false,
                  operator: "eq",
                  value: "test",
                },
              ],
            },
          ],
          paths: [
            { path: "text" },
            { path: "array" },
            { path: "some.nested.value" },
          ],
        }).apply(MOCK)
      ).toEqual(true);
    });
    it("or with nested and", () => {
      expect(
        new PostgrestFilter({
          filters: [
            {
              or: [
                {
                  path: "id",
                  negate: false,
                  operator: "eq",
                  value: 20,
                },
                {
                  and: [
                    {
                      path: "text",
                      negate: false,
                      operator: "eq",
                      value: "some-text",
                    },
                    {
                      path: "id",
                      negate: false,
                      operator: "eq",
                      value: 1,
                    },
                  ],
                },
              ],
            },
          ],
          paths: [
            { path: "text" },
            { path: "array" },
            { path: "some.nested.value" },
          ],
        }).apply(MOCK)
      ).toEqual(true);
    });
    it("negate", () => {
      expect(
        new PostgrestFilter({
          filters: [
            {
              path: "id",
              negate: true,
              operator: "eq",
              value: 123,
            },
          ],
          paths: [
            { path: "text" },
            { path: "array" },
            { path: "some.nested.value" },
          ],
        }).apply(MOCK)
      ).toEqual(true);
    });

    it("array values", () => {
      expect(
        new PostgrestFilter({
          filters: [
            {
              path: "text",
              negate: false,
              operator: "in",
              value: "(element-1,some-text,element-3)",
            },
          ],
          paths: [
            { path: "text" },
            { path: "array" },
            { path: "some.nested.value" },
          ],
        }).apply(MOCK)
      ).toEqual(true);
    });
    it("boolean values", () => {
      expect(
        new PostgrestFilter({
          filters: [
            {
              path: "boolean",
              negate: false,
              operator: "is",
              value: false,
            },
          ],
          paths: [
            { path: "text" },
            { path: "array" },
            { path: "some.nested.value" },
          ],
        }).apply(MOCK)
      ).toEqual(true);
    });

    it("json operator", () => {
      expect(
        new PostgrestFilter({
          filters: [
            {
              path: "some->nested->>value",
              negate: false,
              operator: "eq",
              value: "test",
            },
          ],
          paths: [
            { path: "text" },
            { path: "array" },
            { path: "some.nested.value" },
          ],
        }).apply(MOCK)
      ).toEqual(true);
    });
    it("date values", () => {
      expect(
        new PostgrestFilter({
          filters: [
            {
              path: "date",
              negate: false,
              operator: "lt",
              value: new Date(),
            },
          ],
          paths: [
            { path: "text" },
            { path: "array" },
            { path: "some.nested.value" },
          ],
        }).apply(MOCK)
      ).toEqual(true);
    });
    it("should return false if selected value is not present", () => {
      expect(
        new PostgrestFilter({
          filters: [],
          paths: [
            { path: "does_not_exist" },
            { path: "array" },
            { path: "some.nested.value" },
          ],
        }).apply(MOCK)
      ).toEqual(false);
    });
  });
});
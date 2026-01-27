import { Prisma } from "@prisma/client";

export type CommonDeserializationOptions = {
  deserialize: [
    DateDeserializationConfig,
    JSONInputDeserializationConfig,
    JSONInputDeserializationConfigArray,
    DateDeserializationNullableConfig,
    DecimalDeserializationConfig
  ];
};

export type JSONInputDeserializationConfig = {
  pattern: {
    type: ["string", "number", "boolean", "object", "array"];
  };
  output: Prisma.JsonValue;
};

export type DecimalDeserializationConfig = {
  pattern: {
    type: "number";
    format: "decimal";
  };
  output: Prisma.Decimal;
};

export type JSONInputDeserializationConfigArray = {
  pattern: {
    type: "array";
    items: {
      type: ["string", "number", "boolean", "object", "array"];
    };
  };
  output: Prisma.JsonValue[];
};
export type DateDeserializationConfig = {
  pattern: {
    type: "string";
    format: "date-time";
  };
  output: Date;
};

export type DateDeserializationNullableConfig = {
  pattern: {
    type: "string";
    format: "date-time-nullable";
  };
  output: Date | null;
};

export const JsonValueTypes = [
  "string",
  "number",
  "boolean",
  "object",
  "array",
] as const;

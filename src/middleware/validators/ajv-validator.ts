import Ajv, { Schema } from "ajv";
import { AjvValidationsError } from "./ajv-validator-error";
import addFormats from "ajv-formats";
import cuid from "cuid";

const ajv = new Ajv({
  coerceTypes: "array",
  allErrors: true,
  allowUnionTypes: true,
});
addFormats(ajv);

export const validateJSONSchemaObject = <ObjectType>(
  schema: Schema,
  object: unknown
): ObjectType => {
  const validator = ajv.compile<ObjectType>(schema);
  if (validator(object)) {
    return object;
  } else {
    throw new AjvValidationsError(validator.errors);
  }
};

const checkIdIsNumber = (_schema: unknown, data: number) => {
  return Number.isInteger(data);
};

ajv.addKeyword({
  keyword: "checkIdIsNumber",
  type: "number",
  validate: checkIdIsNumber,
});

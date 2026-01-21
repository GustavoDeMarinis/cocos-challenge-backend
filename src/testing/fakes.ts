import { faker } from "@faker-js/faker";
import { User, UserRole } from "@prisma/client";

import cuid from "cuid";
import { config } from "../config";



export const getFakeUser = (partialUser?: Partial<User>): User => {
  const user: User = {
    id: partialUser?.id ?? cuid(),
    createdAt: partialUser?.createdAt ?? new Date(),
    updatedAt: partialUser?.updatedAt ?? new Date(),
    deletedAt: partialUser?.createdAt ?? null,
    userEmail: partialUser?.userEmail ?? faker.internet.email(),
    userName: partialUser?.userName ?? faker.internet.userName(),
    password: partialUser?.password ?? config.USER_DEFAULT_PASSWORD,
    role: partialUser?.role ?? UserRole.Player,
  };
  return user;
};

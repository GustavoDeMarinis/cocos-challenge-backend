import { seedLocalUsers } from "./seed-users";

export const seedLocal = async () => {
  await seedLocalUsers();
};

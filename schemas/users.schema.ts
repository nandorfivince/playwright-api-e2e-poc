import { z } from 'zod';

export const UserSchema = z.object({
  id: z.number(),
  name: z.string(),
  username: z.string(),
  email: z.string().email(),
  phone: z.string(),
  website: z.string(),
});

export const UsersListSchema = z.array(UserSchema);

/** DEMO: Intentionally wrong schema — expects a field that doesn't exist */
export const UserBrokenSchema = z.object({
  id: z.number(),
  fullName: z.string(),       // ← real field is "name", not "fullName"
  department: z.string(),     // ← doesn't exist in the API
});

import bcrypt from "bcryptjs";
import type { Types } from "mongoose";
import { connectToDatabase } from "@/lib/db/mongoose";
import { ApiError } from "@/lib/http/api-error";
import { User } from "@/models/User";

export async function createUser(email: string, password: string) {
  await connectToDatabase();
  const passwordHash = await bcrypt.hash(password, 12);

  try {
    const user = await User.create({ email, passwordHash });
    return { id: user._id.toString(), email: user.email };
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      throw new ApiError(409, "EMAIL_IN_USE", "An account with this email already exists.");
    }
    throw error;
  }
}

export async function authenticateUser(email: string, password: string) {
  await connectToDatabase();
  const user = await User.findOne({ email }).select("+passwordHash");
  const validPassword = user ? await bcrypt.compare(password, user.passwordHash) : false;
  if (!user || !validPassword) {
    throw new ApiError(401, "INVALID_CREDENTIALS", "Email or password is incorrect.");
  }
  return { id: user._id.toString(), email: user.email };
}

export async function getUserById(userId: string) {
  await connectToDatabase();
  const user = await User.findById(userId).select("email createdAt").lean() as {
    _id: Types.ObjectId;
    email: string;
  } | null;
  if (!user) throw new ApiError(401, "UNAUTHENTICATED", "Please log in to continue.");
  return { id: user._id.toString(), email: user.email };
}

function isDuplicateKeyError(error: unknown): error is { code: number } {
  return typeof error === "object" && error !== null && "code" in error && error.code === 11000;
}

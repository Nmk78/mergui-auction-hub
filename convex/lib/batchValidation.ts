import { ConvexError } from "convex/values";

export type BatchInput = {
  name: string;
  seafoodType: "Fish" | "Shrimp" | "Crab" | "Squid";
  quantity: number;
  weightKg: number;
  catchDate: number;
  arrivalDate: number;
  port: string;
  description: string;
};

export function normalizeBatchInput(input: BatchInput): BatchInput {
  const normalized = {
    ...input,
    name: input.name.trim(),
    port: input.port.trim(),
    description: input.description.trim(),
  };

  if (normalized.name.length < 3 || normalized.name.length > 100) {
    throw new ConvexError("Batch name must contain 3 to 100 characters.");
  }
  if (!Number.isInteger(normalized.quantity) || normalized.quantity <= 0) {
    throw new ConvexError("Quantity must be a positive whole number.");
  }
  if (!Number.isFinite(normalized.weightKg) || normalized.weightKg <= 0) {
    throw new ConvexError("Weight must be greater than zero.");
  }
  if (normalized.port.length < 2 || normalized.port.length > 80) {
    throw new ConvexError("Port must contain 2 to 80 characters.");
  }
  if (normalized.description.length < 10 || normalized.description.length > 1000) {
    throw new ConvexError("Description must contain 10 to 1,000 characters.");
  }
  if (!Number.isFinite(normalized.catchDate) || !Number.isFinite(normalized.arrivalDate)) {
    throw new ConvexError("Catch and arrival dates are required.");
  }
  if (normalized.catchDate > normalized.arrivalDate) {
    throw new ConvexError("Arrival date cannot be before the catch date.");
  }
  if (normalized.arrivalDate > Date.now() + 24 * 60 * 60 * 1000) {
    throw new ConvexError("Arrival date cannot be in the future.");
  }

  return normalized;
}

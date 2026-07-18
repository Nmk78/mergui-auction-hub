import { z } from "zod";
import { SEAFOOD_TYPES } from "@/lib/constants";

export const batchFormSchema = z
  .object({
    name: z.string().trim().min(3, "Use at least 3 characters.").max(100),
    seafoodType: z.enum(SEAFOOD_TYPES),
    quantity: z.number().int("Use a whole number.").positive("Quantity is required."),
    weightKg: z.number().positive("Weight is required."),
    catchDate: z.string().min(1, "Catch date is required."),
    arrivalDate: z.string().min(1, "Arrival date is required."),
    port: z.string().trim().min(2, "Port is required.").max(80),
    description: z
      .string()
      .trim()
      .min(10, "Add at least 10 characters.")
      .max(1000),
  })
  .superRefine((value, ctx) => {
    const catchTime = new Date(`${value.catchDate}T00:00:00`).getTime();
    const arrivalTime = new Date(`${value.arrivalDate}T00:00:00`).getTime();
    if (catchTime > arrivalTime) {
      ctx.addIssue({
        code: "custom",
        path: ["arrivalDate"],
        message: "Arrival cannot be before the catch date.",
      });
    }
    if (arrivalTime > Date.now() + 24 * 60 * 60 * 1000) {
      ctx.addIssue({
        code: "custom",
        path: ["arrivalDate"],
        message: "Arrival cannot be in the future.",
      });
    }
  });

export type BatchFormValues = z.infer<typeof batchFormSchema>;

export function validateImageFiles(files: File[]) {
  if (files.length > 8) {
    return "Select no more than 8 images.";
  }
  const invalidType = files.find((file) => !file.type.startsWith("image/"));
  if (invalidType) {
    return `${invalidType.name} is not an image.`;
  }
  const oversized = files.find((file) => file.size > 10 * 1024 * 1024);
  if (oversized) {
    return `${oversized.name} is larger than 10 MB.`;
  }
  return null;
}

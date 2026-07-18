import Image from "next/image";
import { Fish, Waves } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SeafoodType } from "@/types/domain";

export function SeafoodThumbnail({
  type,
  url,
  alt,
  className,
}: {
  type: SeafoodType;
  url?: string | null;
  alt: string;
  className?: string;
}) {
  if (url) {
    return (
      <div className={cn("relative overflow-hidden bg-muted", className)}>
        <Image
          src={url}
          alt={alt}
          fill
          sizes="(max-width: 768px) 100vw, 320px"
          className="object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center bg-secondary text-primary",
        className,
      )}
      role="img"
      aria-label={`${type} image not uploaded`}
    >
      {type === "Fish" ? (
        <Fish className="size-10" strokeWidth={1.5} />
      ) : (
        <Waves className="size-10" strokeWidth={1.5} />
      )}
    </div>
  );
}

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@contexts/shared/shadcn";
import { useMedia } from "@contexts/shared/infrastructure/hooks/media/useMedia";

interface Props {
  photo: string | null | undefined;
  name: string;
  className?: string;
}

const getInitials = (name: string): string =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "CL";

export const CustomerAvatar = ({ photo, name, className }: Props) => {
  const isDataUrl = photo?.startsWith("data:") ?? false;
  const { data } = useMedia(photo && !isDataUrl ? photo : null);
  const src = isDataUrl ? photo : data?.url;

  return (
    <Avatar className={className}>
      {src && (
        <AvatarImage
          src={src}
          alt={`Fotografía de ${name || "cliente"}`}
          className="object-cover"
        />
      )}
      <AvatarFallback>{getInitials(name)}</AvatarFallback>
    </Avatar>
  );
};

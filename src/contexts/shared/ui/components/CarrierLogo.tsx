import { getCarrierLogo } from "./carrierLogos";

interface CarrierLogoProps {
  name: string | null | undefined;
  className?: string;
}

/** Renders the carrier's logo for a provider name, or nothing if unknown. */
export function CarrierLogo({ name, className }: CarrierLogoProps) {
  const logo = getCarrierLogo(name);
  if (!logo) {
    return null;
  }

  return (
    <img
      src={logo}
      alt={name ?? ""}
      className={className ?? "size-5 object-contain rounded"}
    />
  );
}

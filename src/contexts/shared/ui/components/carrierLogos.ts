import ampmLogo from "@/assets/carriers/ampm.png";
import dhlLogo from "@/assets/carriers/dhl.png";
import estafetaLogo from "@/assets/carriers/estafeta.png";
import fedexLogo from "@/assets/carriers/fedex.png";
import jtExpressLogo from "@/assets/carriers/jt-express.png";
import ninetyMinutesLogo from "@/assets/carriers/ninetyminutes.png";
import paquetexpressLogo from "@/assets/carriers/paquetexpress.png";
import redpackLogo from "@/assets/carriers/redpack.png";
import tresguerrasLogo from "@/assets/carriers/tresguerras.png";
import upsLogo from "@/assets/carriers/ups.jpeg";

export const CARRIER_LOGOS: Record<string, string> = {
  AMPM: ampmLogo,
  DHL: dhlLogo,
  ESTAFETA: estafetaLogo,
  FEDEX: fedexLogo,
  "J&T EXPRESS": jtExpressLogo,
  "99 MINUTOS": ninetyMinutesLogo,
  PAQUETEXPRESS: paquetexpressLogo,
  REDPACK: redpackLogo,
  TRESGUERRAS: tresguerrasLogo,
  UPS: upsLogo,
};

/**
 * Logo for a carrier name such as `"tresguerras"` or `"tresguerras - Nacional"`
 * (takes the carrier part before the service), or `undefined` if unknown.
 */
export function getCarrierLogo(
  name: string | null | undefined,
): string | undefined {
  if (!name) {
    return undefined;
  }

  const carrier = name.split(" - ")[0].trim().toUpperCase();
  return CARRIER_LOGOS[carrier];
}

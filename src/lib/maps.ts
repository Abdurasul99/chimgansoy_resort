import { googleMapsIntegration } from "@/content/integrations";

export function getGoogleMapsEmbedUrl() {
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const { lat, lng } = googleMapsIntegration.coordinates;
  const query = `${lat},${lng}`;

  if (key) {
    const params = new URLSearchParams({
      key,
      q: query,
      zoom: "15",
    });

    return `https://www.google.com/maps/embed/v1/place?${params.toString()}`;
  }

  const fallbackParams = new URLSearchParams({
    q: query,
    z: "15",
    output: "embed",
  });

  return `https://www.google.com/maps?${fallbackParams.toString()}`;
}

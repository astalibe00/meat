interface ApiRequest {
  method?: string;
  query?: Record<string, string | string[] | undefined>;
}

interface ApiResponse {
  status: (code: number) => ApiResponse;
  json: (payload: unknown) => void;
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== "GET") {
    res.status(405).json({ ok: false, error: "Method not allowed" });
    return;
  }

  const lat = Number(req.query?.lat ?? 0);
  const lon = Number(req.query?.lon ?? 0);

  if (!lat || !lon) {
    res.status(400).json({ ok: false, error: "lat va lon kerak" });
    return;
  }

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&accept-language=uz`,
      {
        headers: {
          "user-agent": "fresh-halal-direct-mini-app/1.0",
        },
      },
    );

    if (!response.ok) {
      throw new Error(`Reverse geocode ${response.status}`);
    }

    const payload = (await response.json()) as { display_name?: string };
    res.status(200).json({
      ok: true,
      address: payload.display_name ?? "",
      coordinates: { lat, lon },
    });
  } catch (error) {
    console.error("[reverse-geocode] failed", error);
    res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Geocode failed",
    });
  }
}

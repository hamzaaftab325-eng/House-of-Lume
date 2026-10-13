import { NextResponse } from "next/server";

import { getSearchSuggestions } from "@/server/catalogue/service";
import { normalizePredictiveSearchQuery } from "@/server/catalogue/validation";

const emptySuggestions = {
  products: [],
  categories: [],
  collections: [],
  editorial: [],
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = normalizePredictiveSearchQuery(url.searchParams.get("q"));

  if (!query) {
    return NextResponse.json(emptySuggestions, {
      status: 200,
      headers: { "Cache-Control": "private, max-age=0" },
    });
  }

  try {
    const suggestions = await getSearchSuggestions(query);
    return NextResponse.json(suggestions, {
      headers: {
        "Cache-Control": "public, max-age=30, stale-while-revalidate=120",
      },
    });
  } catch {
    return NextResponse.json(emptySuggestions, {
      status: 503,
      headers: { "Cache-Control": "no-store" },
    });
  }
}

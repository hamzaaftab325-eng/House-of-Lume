import { NextResponse } from "next/server";

import { getSearchSuggestions } from "@/server/catalogue/catalogue.service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q")?.trim().slice(0, 80) ?? "";

  if (query.length < 2) {
    return NextResponse.json({ products: [], categories: [], collections: [] });
  }

  try {
    const suggestions = await getSearchSuggestions(query);
    return NextResponse.json(suggestions, {
      headers: {
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120",
      },
    });
  } catch {
    return NextResponse.json(
      { products: [], categories: [], collections: [], error: "search_unavailable" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}

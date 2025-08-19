import { NextRequest, NextResponse } from "next/server";
import { blockchainService } from "@/server/blockchain";
import { ApiResponse } from "@/types";

// GET /api/events/live - Get live/historical blockchain events
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fromBlock = parseInt(searchParams.get("fromBlock") || "0");
    const toBlock = searchParams.get("toBlock") || "latest";

    // For demo purposes, return mock events
    const events = {
      wrapEvents: [],
      unwrapEvents: [],
      takeBackEvents: []
    };

    const response: ApiResponse<typeof events> = {
      success: true,
      data: events
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error getting events:", error);
    
    const response: ApiResponse<null> = {
      success: false,
      error: "Failed to get events"
    };
    
    return NextResponse.json(response, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { indexerService } from "@/server/indexer";
import { ApiResponse } from "@/types";

// GET /api/indexer/status - Get indexer status
export async function GET() {
  try {
    const status = indexerService.getIndexingStatus();
    
    const response: ApiResponse<typeof status> = {
      success: true,
      data: status
    };
    
    return NextResponse.json(response);
  } catch (error) {
    console.error("Error getting indexer status:", error);
    
    const response: ApiResponse<null> = {
      success: false,
      error: "Failed to get indexer status"
    };
    
    return NextResponse.json(response, { status: 500 });
  }
}

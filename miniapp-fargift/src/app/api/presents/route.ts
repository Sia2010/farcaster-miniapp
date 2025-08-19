import { NextRequest, NextResponse } from "next/server";
import { indexerService } from "@/server/indexer";
import { ApiResponse, PresentListResponse, CreatePresentRequest } from "@/types";

// GET /api/presents - Get presents with pagination and filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    const result = await indexerService.getPresentsWithPagination(page, limit);

    const response: ApiResponse<PresentListResponse> = {
      success: true,
      data: result
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error getting presents:", error);
    
    const response: ApiResponse<null> = {
      success: false,
      error: "Failed to get presents"
    };
    
    return NextResponse.json(response, { status: 500 });
  }
}

// POST /api/presents - Create a new present (mock for demo)
export async function POST(request: Request) {
  try {
    const body: CreatePresentRequest = await request.json();
    
    // Validate required fields
    if (!body.recipients || !body.assets || !body.message) {
      const response: ApiResponse<null> = {
        success: false,
        error: "Missing required fields: recipients, assets, message"
      };
      return NextResponse.json(response, { status: 400 });
    }

    // Generate a mock present ID (in production, this would come from the blockchain)
    const presentId = "0x" + Math.random().toString(16).substr(2, 64);
    
    const response: ApiResponse<{ presentId: string }> = {
      success: true,
      data: { presentId }
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error creating present:", error);
    
    const response: ApiResponse<null> = {
      success: false,
      error: "Failed to create present"
    };
    
    return NextResponse.json(response, { status: 500 });
  }
}

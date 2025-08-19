import { NextRequest, NextResponse } from 'next/server';
import { indexerService } from '@/server/indexer';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fromBlock } = body;
    
    console.log(`Manual trigger: Reindexing from block ${fromBlock || 'latest'}`);
    
    if (fromBlock !== undefined) {
      await indexerService.reindexFromBlock(fromBlock);
    } else {
      // Trigger a full reindex
      await indexerService.reindexFromBlock(0);
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Indexing triggered successfully',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error triggering indexer:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to trigger indexing',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'Use POST to trigger indexing',
    endpoints: {
      trigger: 'POST /api/indexer/trigger',
      status: 'GET /api/indexer/status',
      reindex: 'POST /api/indexer/status'
    }
  });
} 
console.log('🔍 Checking environment variables...\n');

// Check RPC URL
const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL;
if (rpcUrl && !rpcUrl.includes('YOUR_KEY') && !rpcUrl.includes('YOUR_ACTUAL_ALCHEMY_KEY')) {
  console.log('✅ NEXT_PUBLIC_RPC_URL:', rpcUrl);
} else {
  console.log('❌ NEXT_PUBLIC_RPC_URL: Not set or contains placeholder');
  console.log('   Please set NEXT_PUBLIC_RPC_URL in .env.local file');
}

// Check Contract Address
const contractAddress = process.env.NEXT_PUBLIC_PRESENT_CONTRACT;
if (contractAddress) {
  console.log('✅ NEXT_PUBLIC_PRESENT_CONTRACT:', contractAddress);
} else {
  console.log('❌ NEXT_PUBLIC_PRESENT_CONTRACT: Not set');
}

// Check Chain ID
const chainId = process.env.NEXT_PUBLIC_CHAIN_ID;
if (chainId) {
  console.log('✅ NEXT_PUBLIC_CHAIN_ID:', chainId);
} else {
  console.log('❌ NEXT_PUBLIC_CHAIN_ID: Not set (should be 421614 for Arbitrum Sepolia)');
}

console.log('\n📝 To fix RPC issues:');
console.log('1. Create .env.local file in miniapp-fargift directory');
console.log('2. Add: NEXT_PUBLIC_RPC_URL=https://arb-sepolia.g.alchemy.com/v2/YOUR_ACTUAL_KEY');
console.log('3. Replace YOUR_ACTUAL_KEY with your real Alchemy API key');
console.log('4. Restart the development server'); 
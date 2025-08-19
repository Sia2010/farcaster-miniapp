# Miniapp Fargift 🎁

A decentralized gift exchange platform built on Arbitrum Sepolia, featuring a beautiful dark-themed UI with real-time blockchain event indexing.

## ✨ Features

- **Real-time Blockchain Indexing**: Automatically indexes WrapPresent, UnwrapPresent, and TakeBack events
- **Beautiful Dark UI**: Modern, responsive design with smooth animations
- **Live & Historic Views**: Switch between real-time and historical presents
- **Public & Private Gifts**: Create gifts for everyone or specific recipients
- **Smart Contract Integration**: Full integration with Arbitrum Sepolia testnet
- **Event Processing**: Handles both production and test events from the contract

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- pnpm (recommended) or npm

### Installation

1. **Install dependencies**
   ```bash
   pnpm install
   ```

2. **Configure environment**
   ```bash
   cp env.example .env.local
   # Edit .env.local with your configuration
   ```

3. **Start development server**
   ```bash
   pnpm dev
   ```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🌐 Frontend Features

1. **Live Tab**: View real-time presents and events
2. **Historic Tab**: Browse historical presents
3. **Explore Navigation**: Browse all available presents
4. **New Gift Button**: Create new presents (public or private)
5. **Mine Navigation**: View your own presents

## 🔗 API Endpoints

- `GET /api/indexer/status` - Get indexing status
- `GET /api/presents` - List presents with filtering
- `POST /api/presents` - Create new present
- `GET /api/events/live` - Get live blockchain events

## 🎯 Smart Contract Integration

The project integrates with the Fargift smart contract on Arbitrum Sepolia:

- **Contract Address**: `0x3B3cF7ee8dbCDDd8B8451e38269D982F351ca3db`
- **Network**: Arbitrum Sepolia (Chain ID: 421614)
- **Events**: WrapPresent, UnwrapPresent, TakeBack (and Test variants)

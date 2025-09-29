# Squads Multisig Devnet UI

A modern web interface for creating and managing Squads Protocol multisig wallets on Solana Devnet.

## Features

- **Create Multisig Wallets**: Easily create new multisig wallets with customizable parameters
- **Manage Members**: Add members with specific permissions (initiate, vote, execute)
- **Transaction Management**: Create, approve, and execute multisig transactions
- **Vault Balance Tracking**: Monitor vault SOL balance in real-time
- **Wallet Integration**: Supports all major Solana wallets (Phantom, Solflare, Backpack, etc.)
- **Dark Mode**: Beautiful UI with dark/light theme support

## Tech Stack

- **Frontend Framework**: React with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS + shadcn/ui components
- **Blockchain**: Solana Web3.js
- **Multisig Protocol**: Squads SDK (@sqds/multisig)
- **Wallet Adapter**: @solana/wallet-adapter-react

## Getting Started

### Prerequisites

- Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)
- A Solana wallet (Phantom, Solflare, etc.)
- Some Devnet SOL for testing

### Installation

```sh
# Clone the repository
git clone <YOUR_GIT_URL>

# Navigate to the project directory
cd squads-multisig-devnet-ui

# Install dependencies
npm install

# Start the development server
npm run dev
```

The app will be available at `http://localhost:8080`

## Usage

### Creating a Multisig

1. Connect your wallet using the "Connect Wallet" button
2. Click "Create New Multisig"
3. The multisig will be created with:
   - 2/3 threshold (requires 2 signatures out of 3 members)
   - 60-second timelock
   - Your wallet as one of the members
   - Two auto-generated test members

### Managing Multisigs

Once created, you can:
- View multisig details (PDA, vault address, members)
- Check vault balance
- Create new transactions
- Copy addresses to clipboard
- View on Solscan explorer

## Configuration

The app uses Solana Devnet by default. Key configurations:

- **RPC URL**: `https://api.devnet.solana.com`
- **Program ID**: `SQDS4ep65T869zMMBKyuUq6aD6EgTu8psMjkvj52pCf`
- **Treasury**: Auto-detected from program config

## Important Notes

- **Data Persistence**: Currently, multisig data is stored in memory and will be lost on page refresh. This is by design for security.
- **Devnet Only**: This UI is configured for Solana Devnet only. Do not use with mainnet.
- **Test Members**: Auto-generated members are for testing only. In production, use real wallet addresses.

## Project Structure

```
src/
├── components/        # React components
│   ├── MultisigDashboard.tsx
│   ├── TransactionCreator.tsx
│   └── WalletStatus.tsx
├── lib/              # Core services
│   └── squads.ts     # Squads SDK integration
├── hooks/            # Custom React hooks
└── App.tsx          # Main application
```

## Troubleshooting

### Common Issues

1. **"Invalid account provided" error**: This has been fixed. The treasury parameter now correctly uses the program's treasury account.

2. **Wallet disconnects on refresh**: This is expected behavior. Reconnect your wallet after refreshing.

3. **Transaction simulation failed**: Ensure you have enough SOL in your wallet for transaction fees.

## Development

### Build for Production

```sh
npm run build
```

### Run Tests

```sh
npm test
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is open source and available under the MIT License.

## Support

For issues or questions:
- Open an issue on GitHub
- Check the [Squads Documentation](https://docs.squads.so/)
- Visit [Solana Stack Exchange](https://solana.stackexchange.com/)

## Acknowledgments

- Built with [Squads Protocol](https://squads.so/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Deployed on [Lovable](https://lovable.dev)
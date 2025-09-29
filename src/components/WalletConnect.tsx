import React from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@/contexts/WalletProvider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Wallet, Shield, Network } from 'lucide-react';

export const WalletConnect: React.FC = () => {
  const { connected, publicKey } = useWallet();

  if (connected && publicKey) {
    return null; // Don't show this component when wallet is connected
  }

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="w-full max-w-md gradient-card shadow-card border-border/50">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Wallet className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Connect Wallet</CardTitle>
          <CardDescription>
            Connect your Solana wallet to interact with the multisig
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-sm">
              <Shield className="h-4 w-4 text-primary" />
              <span>Secure multi-signature operations</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Network className="h-4 w-4 text-accent" />
              <span>Connected to Solana Devnet</span>
              <Badge variant="outline" className="text-xs">
                DEVNET
              </Badge>
            </div>
          </div>

          <div className="space-y-4">
            <WalletMultiButton className="w-full !bg-primary !text-primary-foreground hover:!bg-primary/90 !transition-smooth" />
            
            <p className="text-xs text-muted-foreground text-center">
              Supported wallets: Phantom, Solflare, and other Solana wallets
            </p>
          </div>

          <div className="rounded-lg bg-muted/50 p-4">
            <h4 className="font-medium text-sm mb-2">Multisig Details</h4>
            <div className="space-y-1 text-xs text-muted-foreground">
              <p>• Threshold: 2 of 3 signatures required</p>
              <p>• Time lock: 60 seconds</p>
              <p>• Network: Solana Devnet</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
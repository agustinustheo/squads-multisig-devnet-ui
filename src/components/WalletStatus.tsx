import React from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton, WalletDisconnectButton } from '@/contexts/WalletProvider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Wallet, CheckCircle, AlertCircle, Copy, ExternalLink } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export const WalletStatus: React.FC = () => {
  const { connected, publicKey, wallet, connecting } = useWallet();

  const copyAddress = () => {
    if (publicKey) {
      navigator.clipboard.writeText(publicKey.toString());
      toast({
        title: "Address Copied",
        description: "Wallet address copied to clipboard",
      });
    }
  };

  const openInExplorer = () => {
    if (publicKey) {
      window.open(`https://explorer.solana.com/address/${publicKey.toString()}?cluster=devnet`, '_blank');
    }
  };

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  return (
    <Card className="gradient-card shadow-card border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5 text-primary" />
          Wallet Status
        </CardTitle>
        <CardDescription>
          Your connected Solana wallet information
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!connected ? (
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <AlertCircle className="h-4 w-4" />
              <span>No wallet connected</span>
            </div>
            <WalletMultiButton className="!bg-primary !text-primary-foreground hover:!bg-primary/90 !transition-smooth" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">Connected</span>
              </div>
              <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                {connecting ? 'Connecting...' : 'Active'}
              </Badge>
            </div>

            {wallet && (
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Wallet</div>
                <div className="flex items-center gap-2">
                  {wallet.adapter.icon && (
                    <img 
                      src={wallet.adapter.icon} 
                      alt={wallet.adapter.name}
                      className="w-6 h-6 rounded"
                    />
                  )}
                  <span className="font-medium">{wallet.adapter.name}</span>
                </div>
              </div>
            )}

            {publicKey && (
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Public Key</div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono text-xs">
                    {truncateAddress(publicKey.toString())}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={copyAddress}
                    className="h-6 w-6 p-0"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={openInExplorer}
                    className="h-6 w-6 p-0"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )}

            <div className="pt-2 border-t border-border">
              <WalletDisconnectButton className="w-full !bg-destructive !text-destructive-foreground hover:!bg-destructive/90 !transition-smooth" />
            </div>
          </div>
        )}

        <div className="text-xs text-muted-foreground text-center pt-2 border-t border-border">
          Connected to Solana Devnet
        </div>
      </CardContent>
    </Card>
  );
};
import React, { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Copy, ExternalLink, Shield, Wallet, Users, Plus } from 'lucide-react';
import { squadsService, MultisigInfo } from '@/lib/squads';
import { toast } from '@/hooks/use-toast';
import { WalletStatus } from './WalletStatus';

interface MultisigDashboardProps {
  onCreateTransaction: () => void;
}

export const MultisigDashboard: React.FC<MultisigDashboardProps> = ({ onCreateTransaction }) => {
  const wallet = useWallet();
  const { connected, publicKey } = wallet;
  const [multisigInfo, setMultisigInfo] = useState<MultisigInfo | null>(null);
  const [vaultBalance, setVaultBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [creatingMultisig, setCreatingMultisig] = useState(false);

  const loadMultisigData = async (multisigAddress?: string) => {
    try {
      setLoading(true);
      const [info, balance] = await Promise.all([
        squadsService.getMultisigInfo(multisigAddress),
        squadsService.getVaultBalance()
      ]);
      setMultisigInfo(info);
      setVaultBalance(balance);
    } catch (error) {
      console.error('Error loading multisig data:', error);
      toast({
        title: "Error",
        description: "Failed to load multisig information",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNewMultisig = async () => {
    if (!connected || !publicKey) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to create a multisig",
        variant: "destructive"
      });
      return;
    }

    try {
      setCreatingMultisig(true);
      
      toast({
        title: "Creating Multisig",
        description: "Creating a new multisig with your wallet...",
      });

      const newMultisig = await squadsService.createMultisig(wallet);

      setMultisigInfo(newMultisig);
      
      // Load the vault balance for the new multisig
      const balance = await squadsService.getVaultBalance(newMultisig.vaultAddress);
      setVaultBalance(balance);

      toast({
        title: "Multisig Created Successfully!",
        description: `New multisig created with PDA: ${newMultisig.address.slice(0, 8)}...`,
      });

    } catch (error) {
      console.error('Error creating multisig:', error);
      toast({
        title: "Failed to Create Multisig",
        description: error instanceof Error ? error.message : "An error occurred while creating the multisig",
        variant: "destructive"
      });
    } finally {
      setCreatingMultisig(false);
    }
  };

  useEffect(() => {
    if (connected) {
      // Check if we have a current multisig from this session
      const currentMultisig = squadsService.getCurrentMultisig();
      if (currentMultisig) {
        setMultisigInfo(currentMultisig);
        loadMultisigData(currentMultisig.address);
      } else {
        // Load fallback multisig data
        loadMultisigData();
      }
    }
  }, [connected]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: `${label} copied to clipboard`,
    });
  };

  const openInExplorer = (address: string) => {
    window.open(`https://solscan.io/account/${address}?cluster=devnet`, '_blank');
  };

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading multisig information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold gradient-text">Squads Multisig Dashboard</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Manage your multisig wallet with secure, collaborative transaction management on Solana Devnet.
        </p>
      </div>

      {/* Create New Multisig Section */}
      {connected && !squadsService.getCurrentMultisig() && (
        <Card className="gradient-card shadow-card border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary-glow" />
              Create New Multisig
            </CardTitle>
            <CardDescription>
              Create a new multisig wallet with your connected wallet as a member
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                <p>• Your wallet will be added as a member with initiate and vote permissions</p>
                <p>• Two additional test members will be generated automatically</p>
                <p>• Requires 2 out of 3 signatures for transactions</p>
                <p>• 60-second time lock for security</p>
              </div>
              
              <Button 
                onClick={handleCreateNewMultisig}
                disabled={creatingMultisig}
                variant="gradient"
                className="w-full"
              >
                {creatingMultisig ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating Multisig...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Create New Multisig
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Multisig Info Card */}
        <Card className="gradient-card shadow-card border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary-glow" />
              Multisig Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <div className="text-2xl font-bold text-primary">
                    {multisigInfo?.threshold || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Threshold</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <div className="text-2xl font-bold text-accent">
                    {multisigInfo?.members || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Members</div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Multisig Address</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono text-xs">
                      {multisigInfo && truncateAddress(multisigInfo.address)}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => multisigInfo && copyToClipboard(multisigInfo.address, 'Multisig address')}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => multisigInfo && openInExplorer(multisigInfo.address)}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                {multisigInfo?.createKey && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Create Key</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="font-mono text-xs">
                        {truncateAddress(multisigInfo.createKey)}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(multisigInfo.createKey!, 'Create key')}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Transaction Index</span>
                  <Badge variant="secondary">
                    {multisigInfo?.transactionIndex || 0}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Vault Balance Card */}
        <Card className="gradient-card shadow-card border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-accent" />
              Vault Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-foreground">
                  {vaultBalance.toFixed(4)} SOL
                </div>
                <div className="text-sm text-muted-foreground">
                  ≈ ${(vaultBalance * 150).toFixed(2)} USD
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Vault Address</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono text-xs">
                      {multisigInfo && truncateAddress(multisigInfo.vaultAddress)}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => multisigInfo && copyToClipboard(multisigInfo.vaultAddress, 'Vault address')}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => multisigInfo && openInExplorer(multisigInfo.vaultAddress)}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {vaultBalance === 0 && (
                <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                  <p className="text-sm text-yellow-600 dark:text-yellow-400">
                    💡 Send SOL to the vault address to test transactions
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Actions Card */}
        <Card className="gradient-card shadow-card border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary-glow" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={onCreateTransaction}
              disabled={!connected || !multisigInfo}
              variant="gradient"
              className="w-full"
            >
              Create Transaction
            </Button>
            
            {connected && multisigInfo && (
              <Button 
                onClick={handleCreateNewMultisig}
                disabled={creatingMultisig}
                variant="outline"
                className="w-full"
              >
                {creatingMultisig ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Another Multisig
                  </>
                )}
              </Button>
            )}
            
            <div className="text-xs text-muted-foreground text-center">
              {connected 
                ? multisigInfo 
                  ? 'Ready to create transactions' 
                  : 'Create a multisig to get started'
                : 'Connect wallet to continue'
              }
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Wallet Status Section */}
      <div className="mt-8">
        <WalletStatus />
      </div>
    </div>
  );
};
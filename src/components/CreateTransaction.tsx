import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Send, AlertCircle } from 'lucide-react';
import { squadsService } from '@/lib/squads';
import { toast } from '@/hooks/use-toast';

interface CreateTransactionProps {
  onBack: () => void;
}

export const CreateTransaction: React.FC<CreateTransactionProps> = ({ onBack }) => {
  const wallet = useWallet();
  const { connected } = wallet;
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreateTransaction = async () => {
    if (!connected || !wallet.publicKey) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to create transactions",
        variant: "destructive"
      });
      return;
    }

    const currentMultisig = squadsService.getCurrentMultisig();
    if (!currentMultisig) {
      toast({
        title: "No multisig found",
        description: "Please create a multisig first",
        variant: "destructive"
      });
      return;
    }

    if (!recipient || !amount) {
      toast({
        title: "Missing information",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      
      const transactionSignature = await squadsService.createTransaction(
        currentMultisig.address,
        recipient,
        parseFloat(amount),
        wallet
      );

      toast({
        title: "Transaction Created!",
        description: `Transaction created with signature: ${transactionSignature.slice(0, 8)}...`,
      });

      // Reset form
      setRecipient('');
      setAmount('');
      
    } catch (error) {
      console.error('Error creating transaction:', error);
      toast({
        title: "Transaction Failed",
        description: error instanceof Error ? error.message : "Failed to create transaction",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const currentMultisig = squadsService.getCurrentMultisig();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={onBack} className="p-2">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold">Create Transaction</h2>
          <p className="text-muted-foreground">
            Propose a new transaction for multisig approval
          </p>
        </div>
      </div>

      {/* Current Multisig Info */}
      {currentMultisig && (
        <Card className="gradient-card shadow-card border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">Current Multisig</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Address</span>
                <Badge variant="outline" className="font-mono text-xs">
                  {currentMultisig.address.slice(0, 8)}...{currentMultisig.address.slice(-8)}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Threshold</span>
                <Badge variant="secondary">
                  {currentMultisig.threshold} of {currentMultisig.members}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {!currentMultisig && (
        <Card className="gradient-card shadow-card border-border/50 border-yellow-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 text-yellow-600 dark:text-yellow-400">
              <AlertCircle className="h-5 w-5" />
              <div>
                <p className="font-medium">No multisig found</p>
                <p className="text-sm">Please create a multisig first before creating transactions</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Transaction Form */}
      <Card className="gradient-card shadow-card border-border/50">
        <CardHeader>
          <CardTitle>Transaction Details</CardTitle>
          <CardDescription>
            Enter the recipient address and amount for the transaction
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="recipient">Recipient Address</Label>
            <Input
              id="recipient"
              placeholder="Enter Solana wallet address..."
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              className="font-mono"
              disabled={!currentMultisig}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount (SOL)</Label>
            <Input
              id="amount"
              type="number"
              step="0.001"
              placeholder="0.000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={!currentMultisig}
            />
          </div>

          <Button 
            onClick={handleCreateTransaction}
            disabled={loading || !connected || !currentMultisig || !recipient || !amount}
            className="w-full"
            variant="gradient"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Creating Transaction...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Create Transaction
              </>
            )}
          </Button>

          {!connected && (
            <p className="text-sm text-muted-foreground text-center">
              Connect your wallet to create transactions
            </p>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="gradient-card shadow-card border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">How it works</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>• Transactions require approval from {currentMultisig?.threshold || 2} out of {currentMultisig?.members || 3} members</p>
            <p>• Once created, other members can approve the transaction</p>
            <p>• After reaching the threshold, any member can execute the transaction</p>
            <p>• All transactions are secured by the multisig's time lock</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@/contexts/WalletProvider';
import { MultisigDashboard } from '@/components/MultisigDashboard';
import { CreateTransaction } from '@/components/CreateTransaction';
import { WalletConnect } from '@/components/WalletConnect';

type ViewMode = 'dashboard' | 'create-transaction';

const Index = () => {
  const { connected } = useWallet();
  const [currentView, setCurrentView] = useState<ViewMode>('dashboard');

  const handleCreateTransaction = () => {
    setCurrentView('create-transaction');
  };

  const handleBack = () => {
    setCurrentView('dashboard');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full gradient-primary shadow-glow"></div>
            <span className="text-xl font-bold">Squads Protocol</span>
          </div>
          
          <div className="flex items-center gap-4">
            {connected && (
              <div className="text-sm text-muted-foreground hidden md:block">
                Solana Devnet
              </div>
            )}
            <WalletMultiButton className="!bg-primary !text-primary-foreground hover:!bg-primary/90 !transition-smooth" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {!connected ? (
          <WalletConnect />
        ) : (
          <>
            {currentView === 'dashboard' && (
              <MultisigDashboard onCreateTransaction={handleCreateTransaction} />
            )}
            {currentView === 'create-transaction' && (
              <CreateTransaction onBack={handleBack} />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-card/30 backdrop-blur-sm mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-sm text-muted-foreground">
              Built with Squads Protocol V4 on Solana Devnet
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <a 
                href="https://squads.so" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-primary transition-colors"
              >
                Squads Protocol
              </a>
              <span>•</span>
              <a 
                href="https://docs.squads.so" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-primary transition-colors"
              >
                Documentation
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;

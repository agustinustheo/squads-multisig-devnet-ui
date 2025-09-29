import * as multisig from '@sqds/multisig';
import { Connection, PublicKey, LAMPORTS_PER_SOL, Transaction, SystemProgram, TransactionInstruction, Keypair } from '@solana/web3.js';
import { WalletContextState } from '@solana/wallet-adapter-react';

// Constants from environment variables (now used as fallbacks only)
export const PROGRAM_ID = import.meta.env.VITE_SQUADS_PROGRAM_ID || 'SQDS4ep65T869zMMBKyuUq6aD6EgTu8psMjkvj52pCf';
export const RPC_URL = import.meta.env.VITE_RPC_URL || 'https://api.devnet.solana.com';

export interface MultisigInfo {
  threshold: number;
  members: number;
  transactionIndex: number;
  address: string;
  vaultAddress: string;
  createKey?: string;
}

export interface TransactionProposal {
  transactionIndex: number;
  status: string;
  approvedBy: string[];
  createdAt: Date;
}

export interface MultisigMember {
  key: string;
  permissions: {
    mask: number;
    initiate: boolean;
    vote: boolean;
    execute: boolean;
  };
}

export interface CreateMultisigParams {
  threshold: number;
  timeLock: number;
  members: MultisigMember[];
}

export class SquadsService {
  private connection: Connection;
  private currentMultisig: MultisigInfo | null = null;
  private sessionMultisigs: Map<string, MultisigInfo> = new Map();

  constructor(rpcUrl?: string) {
    this.connection = new Connection(rpcUrl || RPC_URL, 'confirmed');
  }

  /**
   * Creates a new multisig with the connected wallet as a member
   */
  async createMultisig(wallet: WalletContextState, additionalMembers: string[] = []): Promise<MultisigInfo> {
    try {
      if (!wallet.publicKey || !wallet.signTransaction) {
        throw new Error('Wallet not connected or does not support signing');
      }

      console.log('Creating new multisig with wallet:', wallet.publicKey.toString());

      // Get the program config to fetch the treasury
      const programConfigPda = multisig.getProgramConfigPda({})[0];
      let programTreasury: PublicKey;

      try {
        // Try to fetch program config to get treasury
        const programConfig = await multisig.accounts.ProgramConfig.fromAccountAddress(
          this.connection,
          programConfigPda
        );
        programTreasury = programConfig.treasury;
        console.log('Using program treasury:', programTreasury.toString());
      } catch (error) {
        // If program config account doesn't exist, use the default treasury @sqds/multisig
        programTreasury = new PublicKey('HM5y4mz3Bt9JY9mr1hkyhnvqxSH4H2u2451j7Hc2dtvK');
        console.log('Using default treasury:', programTreasury.toString());
      }

      // Generate test members if no additional members provided
      const testMembers = additionalMembers.length > 0
        ? additionalMembers
        : [
            Keypair.generate().publicKey.toString(),
            Keypair.generate().publicKey.toString()
          ];

      // Create members array with proper permissions for Squads SDK
      const squadMembers = [
        // First test member - can initiate, vote, and execute
        {
          key: new PublicKey(testMembers[0]),
          permissions: {
            mask: 7,
            initiate: true,
            vote: true,
            execute: true
          }
        },
        // Second test member - can vote and execute (no initiate)
        {
          key: new PublicKey(testMembers[1]),
          permissions: {
            mask: 6,
            initiate: false,
            vote: true,
            execute: true
          }
        },
        // Connected wallet - can initiate, vote, and execute
        {
          key: wallet.publicKey,
          permissions: {
            mask: 7,
            initiate: true,
            vote: true,
            execute: true
          }
        }
      ];

      // Create multisig parameters
      const createKey = Keypair.generate();
      const multisigPda = multisig.getMultisigPda({
        createKey: createKey.publicKey,
      })[0];

      const vaultPda = multisig.getVaultPda({
        multisigPda,
        index: 0,
      })[0];

      console.log('Generated multisig PDA:', multisigPda.toString());
      console.log('Generated vault PDA:', vaultPda.toString());

      // Create the multisig using instruction builder with proper manual transaction handling
      const multisigCreateIx = multisig.instructions.multisigCreateV2({
        createKey: createKey.publicKey,
        creator: wallet.publicKey,
        multisigPda,
        configAuthority: null, // Autonomous multisig
        timeLock: 60, // 60 second time lock
        members: squadMembers,
        threshold: 2,
        rentCollector: null,
        treasury: programTreasury, // Use the program's treasury
      });

      // Build the transaction manually
      const transaction = new Transaction().add(multisigCreateIx);

      // Get latest blockhash
      const { blockhash, lastValidBlockHeight } = await this.connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = wallet.publicKey;

      // Sign with createKey first
      transaction.partialSign(createKey);

      // Then sign with wallet
      const signedTransaction = await wallet.signTransaction(transaction);

      console.log('Sending multisig creation transaction...');

      // Send the transaction
      const signature = await this.connection.sendRawTransaction(signedTransaction.serialize());

      console.log('Transaction sent, signature:', signature);

      // Confirm the transaction
      await this.connection.confirmTransaction({
        signature,
        blockhash,
        lastValidBlockHeight,
      });

      console.log('Multisig creation transaction confirmed!');

      // Create the multisig info object
      const multisigInfo: MultisigInfo = {
        address: multisigPda.toString(),
        vaultAddress: vaultPda.toString(),
        createKey: createKey.publicKey.toString(),
        threshold: 2, // 2 out of 3 signatures required
        members: squadMembers.length,
        transactionIndex: 0
      };

      // Store in session and set as current
      this.sessionMultisigs.set(wallet.publicKey.toString(), multisigInfo);
      this.currentMultisig = multisigInfo;

      console.log('Multisig created successfully on blockchain:', multisigInfo);
      return multisigInfo;

    } catch (error) {
      console.error('Error creating multisig:', error);
      throw new Error(`Failed to create multisig: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Gets multisig information, prioritizing current session over environment variables
   */
  async getMultisigInfo(multisigPda?: string): Promise<MultisigInfo | null> {
    try {
      // If a specific PDA is provided, use it
      if (multisigPda) {
        try {
          const multisigAccount = await multisig.accounts.Multisig.fromAccountAddress(
            this.connection,
            new PublicKey(multisigPda)
          );

          const vaultPda = multisig.getVaultPda({
            multisigPda: new PublicKey(multisigPda),
            index: 0,
          })[0];

          return {
            address: multisigPda,
            vaultAddress: vaultPda.toString(),
            threshold: multisigAccount.threshold,
            members: multisigAccount.members.length,
            transactionIndex: Number(multisigAccount.transactionIndex),
          };
        } catch (accountError) {
          console.warn(`Multisig account ${multisigPda} not found on blockchain:`, accountError);
          
          // If this was our current multisig and it doesn't exist, clear it
          if (this.currentMultisig && this.currentMultisig.address === multisigPda) {
            console.log('Clearing stale current multisig data');
            this.currentMultisig = null;
          }
          
          // Clear from session multisigs if it exists there
          for (const [walletKey, multisigInfo] of this.sessionMultisigs.entries()) {
            if (multisigInfo.address === multisigPda) {
              console.log(`Clearing stale multisig data for wallet ${walletKey}`);
              this.sessionMultisigs.delete(walletKey);
              break;
            }
          }
          
          return null;
        }
      }

      // Check if we have a current multisig from this session
      if (this.currentMultisig) {
        // Verify the current multisig actually exists on blockchain
        try {
          const multisigAccount = await multisig.accounts.Multisig.fromAccountAddress(
            this.connection,
            new PublicKey(this.currentMultisig.address)
          );
          
          // Update with fresh data from blockchain
          return {
            ...this.currentMultisig,
            threshold: multisigAccount.threshold,
            members: multisigAccount.members.length,
            transactionIndex: Number(multisigAccount.transactionIndex),
          };
        } catch (accountError) {
          console.warn(`Current multisig ${this.currentMultisig.address} not found on blockchain, clearing stale data:`, accountError);
          this.currentMultisig = null;
          return null;
        }
      }

      // No multisig found - return null to indicate no multisig exists
      return null;

    } catch (error) {
      console.error('Error fetching multisig info:', error);
      // Don't throw here - return null to indicate no multisig available
      return null;
    }
  }

  /**
   * Gets the current multisig for this session
   */
  getCurrentMultisig(): MultisigInfo | null {
    return this.currentMultisig;
  }

  /**
   * Sets the current multisig for this session
   */
  setCurrentMultisig(multisigInfo: MultisigInfo): void {
    this.currentMultisig = multisigInfo;
  }

  /**
   * Gets multisig for a specific wallet from session storage
   */
  getMultisigForWallet(walletAddress: string): MultisigInfo | null {
    return this.sessionMultisigs.get(walletAddress) || null;
  }

  /**
   * Clears the current session multisig data
   */
  clearSession(): void {
    this.currentMultisig = null;
    this.sessionMultisigs.clear();
  }

  async getVaultBalance(vaultAddress?: string): Promise<number> {
    try {
      // Use current multisig vault if available, otherwise use provided address or fallback
      const vaultAddr = vaultAddress || 
                       this.currentMultisig?.vaultAddress || 
                       import.meta.env.VITE_VAULT_ADDRESS || 
                       '7wqdf8iGDTZjA9HpzUduafzNrABxL2it7DPV9t1uTht';
      
      const vaultKey = new PublicKey(vaultAddr);
      const balance = await this.connection.getBalance(vaultKey);
      return balance / LAMPORTS_PER_SOL;
    } catch (error) {
      console.error('Error fetching vault balance:', error);
      return 0;
    }
  }

  async createTransaction(
    multisigPda: string,
    recipient: string,
    amount: number,
    wallet: WalletContextState
  ): Promise<string> {
    try {
      if (!wallet.publicKey || !wallet.signTransaction) {
        throw new Error('Wallet not connected or does not support signing');
      }

      // Create a simple SOL transfer transaction as a demo
      const recipientKey = new PublicKey(recipient);
      const lamports = amount * LAMPORTS_PER_SOL;

      const transferInstruction = SystemProgram.transfer({
        fromPubkey: wallet.publicKey,
        toPubkey: recipientKey,
        lamports: lamports,
      });

      const transaction = new Transaction().add(transferInstruction);
      
      // Get latest blockhash
      const { blockhash, lastValidBlockHeight } = await this.connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = wallet.publicKey;

      // Sign the transaction
      const signedTransaction = await wallet.signTransaction(transaction);
      
      // Send the transaction
      const signature = await this.connection.sendRawTransaction(signedTransaction.serialize());
      
      // Confirm the transaction
      await this.connection.confirmTransaction({
        signature,
        blockhash,
        lastValidBlockHeight,
      });

      return signature;
    } catch (error) {
      console.error('Error creating transaction:', error);
      throw error;
    }
  }

  async approveTransaction(
    multisigPda: string,
    transactionIndex: number,
    wallet: WalletContextState
  ): Promise<string> {
    try {
      // For demo purposes, simulate approval
      console.log('Approving transaction:', { multisigPda, transactionIndex });
      
      if (!wallet.publicKey) {
        throw new Error('Wallet not connected');
      }
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Return a mock transaction signature
      const mockSignature = `${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
      
      return mockSignature;
    } catch (error) {
      console.error('Error approving transaction:', error);
      throw error;
    }
  }

  async executeTransaction(
    multisigPda: string,
    transactionIndex: number,
    wallet: WalletContextState
  ): Promise<string> {
    try {
      // For demo purposes, simulate execution
      console.log('Executing transaction:', { multisigPda, transactionIndex });
      
      if (!wallet.publicKey) {
        throw new Error('Wallet not connected');
      }
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Return a mock transaction signature
      const mockSignature = `${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
      
      return mockSignature;
    } catch (error) {
      console.error('Error executing transaction:', error);
      throw error;
    }
  }
}

export const squadsService = new SquadsService();
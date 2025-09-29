/// <reference types="vite/client" />

// Global polyfills for Solana/blockchain packages
import { Buffer } from "buffer";

declare global {
  interface Window {
    Buffer: typeof Buffer;
    process: any;
  }
  
  var Buffer: typeof Buffer;
  var process: any;
}

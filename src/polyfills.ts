// Polyfills for Node.js modules in browser environment
import { Buffer } from "buffer";
import process from "process";

// Make Buffer and process available globally
if (typeof globalThis !== "undefined") {
  (globalThis as any).Buffer = Buffer;
  (globalThis as any).process = process;
} else if (typeof window !== "undefined") {
  (window as any).Buffer = Buffer;
  (window as any).process = process;
} else if (typeof global !== "undefined") {
  (global as any).Buffer = Buffer;
  (global as any).process = process;
}

export { Buffer, process };
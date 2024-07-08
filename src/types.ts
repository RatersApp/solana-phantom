import { PublicKey, Transaction, VersionedTransaction, SendOptions } from '@solana/web3.js';

type DisplayEncoding = 'utf8' | 'hex';

type PhantomEvent = 'connect' | 'disconnect' | 'accountChanged';

type PhantomRequestMethod =
  | 'connect'
  | 'disconnect'
  | 'signAndSendTransaction'
  | 'signAndSendTransactionV0'
  | 'signAndSendTransactionV0WithLookupTable'
  | 'signTransaction'
  | 'signAllTransactions'
  | 'signMessage'
  | 'signIn';

interface ConnectOpts {
  onlyIfTrusted: boolean;
}

export interface PhantomProvider {
  publicKey: PublicKey | null;
  isConnected: boolean | null;
  signAndSendTransaction: (
    transaction: Transaction | VersionedTransaction,
    opts?: SendOptions
  ) => Promise<{ signature: string; publicKey: PublicKey }>;
  signTransaction: (transaction: Transaction | VersionedTransaction) => Promise<Transaction | VersionedTransaction>;
  signAllTransactions: (
    transactions: (Transaction | VersionedTransaction)[]
  ) => Promise<(Transaction | VersionedTransaction)[]>;
  signMessage: (message: Uint8Array | string, display?: DisplayEncoding) => Promise<any>;
  signIn: (data: SolanaSignInInput) => Promise<{signature: ArrayBuffer, signedMessage: ArrayBuffer, publicKey: PublicKey}>;
  connect: (opts?: Partial<ConnectOpts>) => Promise<{ publicKey: PublicKey }>;
  disconnect: () => Promise<void>;
  on: (event: PhantomEvent, handler: (args: any) => void) => void;
  request: (method: PhantomRequestMethod, params: any) => Promise<unknown>;
}

export type Status = 'success' | 'warning' | 'error' | 'info';

export interface TLog {
  status: Status;
  method?: PhantomRequestMethod | Extract<PhantomEvent, 'accountChanged'> | 'onChangeConnectionURI';
  message: string;
  messageTwo?: string;
}


export interface SolanaSignInInput {
  /**
   * Optional EIP-4361 Domain.
   * If not provided, the wallet must determine the Domain to include in the message.
   */
  readonly domain?: string;

  /**
   * Optional EIP-4361 Address.
   * If not provided, the wallet must determine the Address to include in the message.
   */
  readonly address?: string;

  /**
   * Optional EIP-4361 Statement.
   * If not provided, the wallet must not include Statement in the message.
   */
  readonly statement?: string;

  /**
   * Optional EIP-4361 URI.
   * If not provided, the wallet must not include URI in the message.
   */
  readonly uri?: string;

  /**
   * Optional EIP-4361 Version.
   * If not provided, the wallet must not include Version in the message.
   */
  readonly version?: string;

  /**
   * Optional EIP-4361 Chain ID.
   * If not provided, the wallet must not include Chain ID in the message.
   */
  readonly chainId?: string;

  /**
   * Optional EIP-4361 Nonce.
   * If not provided, the wallet must not include Nonce in the message.
   */
  readonly nonce?: string;

  /**
   * Optional EIP-4361 Issued At.
   * If not provided, the wallet must not include Issued At in the message.
   */
  readonly issuedAt?: string;

  /**
   * Optional EIP-4361 Expiration Time.
   * If not provided, the wallet must not include Expiration Time in the message.
   */
  readonly expirationTime?: string;

  /**
   * Optional EIP-4361 Not Before.
   * If not provided, the wallet must not include Not Before in the message.
   */
  readonly notBefore?: string;

  /**
   * Optional EIP-4361 Request ID.
   * If not provided, the wallet must not include Request ID in the message.
   */
  readonly requestId?: string;

  /**
   * Optional EIP-4361 Resources.
   * If not provided, the wallet must not include Resources in the message.
   */
  readonly resources?: readonly string[];
}
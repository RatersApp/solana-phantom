/**
 * @DEV: If the sandbox is throwing dependency errors, chances are you need to clear your browser history.
 * This will trigger a re-install of the dependencies in the sandbox – which should fix things right up.
 * Alternatively, you can fork this sandbox to refresh the dependencies manually.
 */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import styled from 'styled-components';
import { Connection, PublicKey , Keypair, LAMPORTS_PER_SOL, clusterApiUrl} from '@solana/web3.js';
import {
  createTransferCheckedInstruction,
  getAssociatedTokenAddress,
  getMint,
  getOrCreateAssociatedTokenAccount,
  TOKEN_PROGRAM_ID
} from '@solana/spl-token'
import {
  createAddressLookupTable,
  createTransferTransaction,
  createTransferTransactionV0,
  extendAddressLookupTable,
  getProvider,
  pollSignatureStatus,
  signAllTransactions,
  signAndSendTransaction,
  signAndSendTransactionV0WithLookupTable,
  signMessage,
  signTransaction,
  createSignInData, 
  createSignInErrorData,
  createSignInMessage,
  type SolanaSignInInput
} from './utils';

import { TLog } from './types';

import { Logs, Sidebar, NoProvider } from './components';

import { host } from './constants';

import * as ed25519 from '@noble/ed25519';
import { sha512 } from '@noble/hashes/sha512';

import { base58_to_binary } from "base58-js";


ed25519.etc.sha512Sync = (...m) => sha512(ed25519.etc.concatBytes(...m));

// =============================================================================
// Styled Components
// =============================================================================

const StyledApp = styled.div`
  display: flex;
  flex-direction: row;
  height: 100vh;
  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

// =============================================================================
// Constants
// =============================================================================

let   NETWORK /*= 'https://rpc.testnet.fantom.network/'*/;
const provider = getProvider();
const message = 'Just Sign Message.';

// =============================================================================
// Typedefs
// =============================================================================

export type IMethods =
  | {
    name: string;
    onClick: () => Promise<string>;
  }
  | {
    name: string;
    onClick: () => Promise<void>;
  };

interface Props {
  publicKey: PublicKey | null;
  connectedMethods: IMethods[];
  walletMethods: IMethods[];
  onChangeConnectionURI: (e: React.ChangeEvent<HTMLInputElement>) => void
  handleConnect: () => Promise<void>;
  logs: TLog[];
  connection?: Connection
  clearLogs: () => void;
}

// =============================================================================
// Hooks
// =============================================================================

 
const useProps = (): Props => {
  const [logs, setLogs] = useState<TLog[]>([]);
  const [connection, setConnection] = useState<Connection | null>(null);
  const [publicKey, setPublicKey] = useState<PublicKey | null>(null);

  const createLog = useCallback(
    (log: TLog) => {
      return setLogs((logs) => [...logs, log]);
    },
    [setLogs]
  );

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, [setLogs]);

  useEffect(() => {
    if (!provider) return;

    // attempt to eagerly connect
    provider.connect({ onlyIfTrusted: true }).catch(() => {
      setPublicKey(null);
      // fail silently
    });

    provider.on('connect', (publicKey: PublicKey) => {
      setPublicKey(publicKey);
      createLog({
        status: 'success',
        method: 'connect',
        message: `Connected to account ${publicKey.toBase58()}`,
      });
    });

    provider.on('disconnect', () => {
      setPublicKey(null);
      createLog({
        status: 'warning',
        method: 'disconnect',
        message: '👋',
      });
    });

    provider.on('accountChanged', (publicKey: PublicKey | null) => {
      if (publicKey) {
        setPublicKey(publicKey);
        createLog({
          status: 'info',
          method: 'accountChanged',
          message: `Switched to account ${publicKey.toBase58()}`,
        });
      } else {
        /**
         * In this case dApps could...
         *
         * 1. Not do anything
         * 2. Only re-connect to the new account if it is trusted
         *
         * ```
         * provider.connect({ onlyIfTrusted: true }).catch((err) => {
         *  // fail silently
         * });
         * ```
         *
         * 3. Always attempt to reconnect
         */
        setPublicKey(null);
        createLog({
          status: 'info',
          method: 'accountChanged',
          message: 'Attempting to switch accounts.',
        });

        provider.connect().catch((error) => {
          setPublicKey(null);
          createLog({
            status: 'error',
            method: 'accountChanged',
            message: `Failed to re-connect: ${error.message}`,
          });
        });
      }
    });

    return () => {
      provider.disconnect();
    };
  }, [createLog]);

  /** SignAndSendTransaction */
  const handleSignAndSendTransaction = useCallback(async () => {
    if (!provider || !connection) return;

    try {
      const transaction = await createTransferTransaction(provider.publicKey, connection);
      createLog({
        status: 'info',
        method: 'signAndSendTransaction',
        message: `Requesting signature for: ${JSON.stringify(transaction)}`,
      });
      const signature = await signAndSendTransaction(provider, transaction);
      createLog({
        status: 'info',
        method: 'signAndSendTransaction',
        message: `Signed and submitted transaction ${signature}.`,
      });
      pollSignatureStatus(signature, connection, createLog);
    } catch (error) {
      createLog({
        status: 'error',
        method: 'signAndSendTransaction',
        message: error.message,
      });
    }
  }, [createLog, connection]);

  /** SignAndSendTransactionV0 */
  const handleSignAndSendTransactionV0 = useCallback(async () => {
    if (!provider || !connection) return;

    try {
      const transactionV0 = await createTransferTransactionV0(provider.publicKey, connection);
      createLog({
        status: 'info',
        method: 'signAndSendTransactionV0',
        message: `Requesting signature for: ${JSON.stringify(transactionV0)}`,
      });
      const signature = await signAndSendTransaction(provider, transactionV0);
      createLog({
        status: 'info',
        method: 'signAndSendTransactionV0',
        message: `Signed and submitted transactionV0 ${signature}.`,
      });
      console.log("signature: ", base58_to_binary(signature));
      console.log("message_bytes: ", transactionV0.message.serialize());
      console.log("publicKey: ", publicKey.toBase58());
      globalThis.signature = base58_to_binary(signature);
      globalThis.message = transactionV0;
      globalThis.publicKey = publicKey.toBuffer();
      globalThis.ed25519 = ed25519;
      const verified = await ed25519.verify( base58_to_binary(signature), transactionV0.serialize(), publicKey.toBuffer());
      console.log("Verified: ", verified);

      pollSignatureStatus(signature, connection, createLog);
    } catch (error) {
      createLog({
        status: 'error',
        method: 'signAndSendTransactionV0',
        message: error.message,
      });
    }
  }, [createLog, connection]);

  /** SignAndSendTransactionV0WithLookupTable */
  const handleSignAndSendTransactionV0WithLookupTable = useCallback(async () => {
    if (!provider || !connection) return;
    try {
      const [lookupSignature, lookupTableAddress] = await createAddressLookupTable(
        provider,
        provider.publicKey,
        connection,
        await connection.getLatestBlockhash().then((res) => res.blockhash)
      );
      createLog({
        status: 'info',
        method: 'signAndSendTransactionV0WithLookupTable',
        message: `Signed and submitted transactionV0 to make an Address Lookup Table ${lookupTableAddress} with signature: ${lookupSignature}. Please wait for 5-7 seconds after signing the next transaction to be able to see the next transaction popup. This time is needed as newly appended addresses require one slot to warmup before being available to transactions for lookups.`,
      });
      const extensionSignature = await extendAddressLookupTable(
        provider,
        provider.publicKey,
        connection,
        await connection.getLatestBlockhash().then((res) => res.blockhash),
        lookupTableAddress
      );
      createLog({
        status: 'info',
        method: 'signAndSendTransactionV0WithLookupTable',
        message: `Signed and submitted transactionV0 to extend Address Lookup Table ${extensionSignature}.`,
      });

      const signature = await signAndSendTransactionV0WithLookupTable(
        provider,
        provider.publicKey,
        connection,
        await connection.getLatestBlockhash().then((res) => res.blockhash),
        lookupTableAddress
      );
      createLog({
        status: 'info',
        method: 'signAndSendTransactionV0WithLookupTable',
        message: `Signed and submitted transactionV0 with Address Lookup Table ${signature}.`,
      });
      pollSignatureStatus(signature, connection, createLog);
    } catch (error) {
      createLog({
        status: 'error',
        method: 'signAndSendTransactionV0WithLookupTable',
        message: error.message,
      });
    }
  }, [createLog, connection]);

  /** SignTransaction */
  const handleSignTransaction = useCallback(async () => {
    if (!provider || !connection) return;

    try {
      const transaction = await createTransferTransaction(provider.publicKey, connection);
      createLog({
        status: 'info',
        method: 'signTransaction',
        message: `Requesting signature for: ${JSON.stringify(transaction)}`,
      });
      const signedTransaction = await signTransaction(provider, transaction);
      createLog({
        status: 'success',
        method: 'signTransaction',
        message: `Transaction signed: ${JSON.stringify(signedTransaction)}`,
      });
    } catch (error) {
      createLog({
        status: 'error',
        method: 'signTransaction',
        message: error.message,
      });
    }
  }, [createLog, connection]);

  /** SignAllTransactions */
  const handleSignAllTransactions = useCallback(async () => {
    if (!provider || !connection) return;

    try {
      const transactions = [
        await createTransferTransaction(provider.publicKey, connection),
        await createTransferTransaction(provider.publicKey, connection),
      ];
      createLog({
        status: 'info',
        method: 'signAllTransactions',
        message: `Requesting signature for: ${JSON.stringify(transactions)}`,
      });
      const signedTransactions = await signAllTransactions(provider, transactions[0], transactions[1]);
      createLog({
        status: 'success',
        method: 'signAllTransactions',
        message: `Transactions signed: ${JSON.stringify(signedTransactions)}`,
      });
    } catch (error) {
      createLog({
        status: 'error',
        method: 'signAllTransactions',
        message: error.message,
      });
    }
  }, [createLog, connection]);

  /** SignMessage */
  const handleSignMessage = useCallback(async () => {
    if (!provider) return;

    try {
      const signedMessage = await signMessage(provider, message);
      createLog({
        status: 'success',
        method: 'signMessage',
        message: `Message signed: ${JSON.stringify(signedMessage)}`,
      });
      return signedMessage;
    } catch (error) {
      createLog({
        status: 'error',
        method: 'signMessage',
        message: error.message,
      });
    }
  }, [createLog]);

  /** Connect */
  const handleConnect = useCallback(async () => {
    if (!provider) return;

    try {
      await provider.connect();
    } catch (error) {
      createLog({
        status: 'error',
        method: 'connect',
        message: error.message,
      });
    }
  }, [createLog]);

  /** Disconnect */
  const handleDisconnect = useCallback(async () => {
    if (!provider) return;

    try {
      await provider.disconnect();
    } catch (error) {
      createLog({
        status: 'error',
        method: 'disconnect',
        message: error.message,
      });
    }
  }, [createLog]);

    /** SignIn */
    const handleSignIn = useCallback(async () => {
      if (!provider || !publicKey) return;
      
      try {
        
        // Front end message
        const signInData: SolanaSignInInput = await createSignInData();
         // Fetch the signInInput from the backend
        // const createResponse = await fetch(`${host}/siws.php`);
        // const signInData: SolanaSignInInput = await createResponse.json();
         
        // const { publicKey, secretKey } = (this._keypair ||= new Keypair());
        const domain = signInData.domain || window.location.host;
        const address = signInData.address || publicKey.toBase58();

        let signature, message;
        
        if('signIn' in provider && typeof provider.signIn == 'function'){
          signature = await provider.signIn({...signInData, domain, address});
          const message_bytes = signature.signedMessage;
          console.log("signature: ", signature.signature);
          console.log("message_bytes: ", message_bytes);
          console.log("publicKey: ", publicKey.toBuffer());
          const verified = await ed25519.verify(signature.signature, message_bytes, publicKey.toBuffer());
          console.log("Verified: ", verified);

          message = String.fromCharCode(...signature.signedMessage);
          signature = {publicKey: publicKey.toBase58(), signature: signature.signature};

        }else{

          const [msg, signedMessage] = createSignInMessage({
            ...signInData,
            domain,
            address
          });
          
          signature = await provider.signMessage(signedMessage);

          message = msg;
        }

        // const verifyResponse = await fetch(`${host}/siws.php`, {
        //   method: "POST",
        //   body: JSON.stringify({
        //     ...signature,
        //     message,
        //   }),
        // });

        // const serverVerify = await verifyResponse.json();
        
        // if(serverVerify.message || !serverVerify.valid){
        //   throw new Error(serverVerify.message);
        // }

        // Nodejs/Frontend Implementation
        // import { ed25519 } from '@noble/curves/ed25519';
        // const signature = ed25519.sign(signedMessage, secretKey.slice(0, 32));
        // ed25519.verify(signature.signature, signedMessage, signature.publicKey);

        createLog({
          status: 'success',
          method: 'signIn',
          message: `SignIn and backend verified: ${message} by ${address} with signature ${JSON.stringify(signature)}`,
        });
      } catch (error) {
        createLog({
          status: 'error',
          method: 'signIn',
          message: error.message,
        });
      }
    }, [createLog, publicKey]);
  
    /** SignInError */
    const handleSignInError = useCallback(async () => {
      if (!provider || !publicKey) return;
      const signInData: SolanaSignInInput = await createSignInErrorData();

      try {

        // const { publicKey, secretKey } = (this._keypair ||= new Keypair());
        const domain = signInData.domain || window.location.host;
        const address = signInData.address || publicKey.toBase58();
        let signature, message;
        
        if('signIn' in provider && typeof provider.signIn == 'function'){
          signature = await provider.signIn({...signInData, domain, address});
          
          message = String.fromCharCode(...signature.signedMessage);
          signature = {publicKey: publicKey.toBase58(), signature: signature.signature};

        }else{

          const [msg, signedMessage] = createSignInMessage({
            ...signInData,
            domain,
            address
          });
          
          signature = await provider.signMessage(signedMessage);

          message = msg;
        }

        const verifyResponse = await fetch(`${host}/siws.php`, {
          method: "POST",
          body: JSON.stringify({
            signature,
            message,
            publicKey
          }),
        });

        const serverVerify = await verifyResponse.json();
        
        if(serverVerify.message || !serverVerify.valid){
          throw new Error(serverVerify.message);
        }
        // const signature = ed25519.sign(signedMessage, secretKey.slice(0, 32));

        createLog({
          status: 'success',
          method: 'signIn',
          message: `Message signed: ${message} by ${address} with signature ${JSON.stringify(signature)}`,
        });
      } catch (error) {
        createLog({
          status: 'error',
          method: 'signIn',
          message: error.message,
        });
      }
    }, [createLog, publicKey]);



  const connectedMethods = useMemo(() => {
    return [
      {
        name: 'Sign and Send Transaction (Legacy)',
        onClick: handleSignAndSendTransaction,
      },
      {
        name: 'Sign and Send Transaction (v0)',
        onClick: handleSignAndSendTransactionV0,
      },
      {
        name: 'Sign and Send Transaction (v0 + Lookup table)',
        onClick: handleSignAndSendTransactionV0WithLookupTable,
      },
      {
        name: 'Sign Transaction',
        onClick: handleSignTransaction,
      },
      {
        name: 'Sign All Transactions',
        onClick: handleSignAllTransactions,
      }
    ];
  }, [
    handleSignAndSendTransaction,
    handleSignAndSendTransactionV0,
    handleSignAndSendTransactionV0WithLookupTable,
    handleSignTransaction,
    handleSignAllTransactions
  ]);

  const walletMethods = useMemo(() => {
    return [
      {
        name: 'Sign Message',
        onClick: handleSignMessage,
      },
      {
        name: 'SignIn',
        onClick: handleSignIn,
      },
      {
        name: 'SignIn Error',
        onClick: handleSignInError,
      },
      {
        name: 'Disconnect',
        onClick: handleDisconnect,
      },
    ];
  }, [
    handleSignInError,
    handleSignIn,
    handleSignMessage,
    handleDisconnect,
  ]);

  const onChangeConnectionURI = useCallback(async({target: {value: inputValue}}: React.ChangeEvent<HTMLInputElement> = {target : {value: connection?.rpcEndpoint}} as React.ChangeEvent<HTMLInputElement>) => {
    try {
      NETWORK = new URL(inputValue).toString();
      const conn = new Connection(NETWORK);
      setConnection( conn );
      // const usdcAddress = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');
      // const buyerPublicKey = new PublicKey('8bByRAc5GnCwBdXiupaHcuZietJHYyLkEpdqFynCYYdG');
      //  // Get the buyer's USDC token account address
      // const buyerUsdcAddress = await getAssociatedTokenAddress(
      //   usdcAddress,
      //   buyerPublicKey
      // )
      // const usdcMint = await getMint(conn, usdcAddress);
      // console.log(usdcMint);
      // console.log(buyerUsdcAddress.toBase58());
      // console.log(TOKEN_PROGRAM_ID.toBase58());
      createLog({
        status: 'info',
        method: 'onChangeConnectionURI',
        message: `connection: ${conn.rpcEndpoint}`,
      });
    } catch (error) {
      createLog({
        status: 'error',
        method: 'onChangeConnectionURI',
        message: `Failed to make connection: ${error.message}`,
      });
      setConnection( null );}

  }, [setConnection, createLog]);



  
  return {
    publicKey: provider?.publicKey || null,
    connectedMethods,
    walletMethods,
    handleConnect,
    logs,
    clearLogs,
    onChangeConnectionURI,
    connection
  };
};

// =============================================================================
// Stateless Component
// =============================================================================

const StatelessApp = React.memo((props: Props) => {
  const { publicKey, connectedMethods, walletMethods, handleConnect, logs, clearLogs, connection, onChangeConnectionURI} = props;

  return (
    <StyledApp>
      <Sidebar connection={connection} 
              publicKey={publicKey} 
              walletMethods={walletMethods} 
              onChangeConnectionURI={onChangeConnectionURI} 
              connectedMethods={connectedMethods} 
              connect={handleConnect} />
      <Logs publicKey={publicKey} logs={logs} clearLogs={clearLogs} />
    </StyledApp>
  );
});

// =============================================================================
// Main Component
// =============================================================================

const App = () => {
  const props = useProps();

  if (!provider) {
    return <NoProvider />;
  }

  return <StatelessApp {...props} />;
};

export default App;
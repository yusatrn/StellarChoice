import * as freighterApi from '@stellar/freighter-api';
import * as StellarSdk from '@stellar/stellar-sdk'; // Use this for all SDK components

// Network details
interface NetworkDetails {
  networkUrl: string; // Horizon URL
  sorobanRpcUrl: string;
  networkPassphrase: string;
  contractId: string;
}

const TESTNET_DETAILS: NetworkDetails = {
  networkUrl: 'https://horizon-testnet.stellar.org',
  sorobanRpcUrl: 'https://soroban-testnet.stellar.org',
  networkPassphrase: 'Test SDF Network ; September 2015', // Direct string for testnet
  contractId: 'CAPINXA4OLRUTPEGCHSY7DZFS6VIPJNIQ53Y6DOBUVBPOUPSIA3JNFUD', // Your contract ID
};

// Create a server instance for the Stellar Testnet using the namespace from StellarSdk
export const server = new StellarSdk.SorobanRpc.Server(TESTNET_DETAILS.sorobanRpcUrl, {
  allowHttp: true, // Allow HTTP for development
});

// Create a Horizon instance for the Testnet
export const horizonServer = new StellarSdk.Horizon.Server(TESTNET_DETAILS.networkUrl);

const {
  TransactionBuilder,
  Networks,
  scValToNative,
  nativeToScVal,
  Operation,
  Account,
  Contract,
  Memo,
  BASE_FEE,
  Keypair,
  SorobanDataBuilder,
  xdr,
  TimeoutInfinite,
  StrKey,
} = StellarSdk;

export interface TransactionResult {
  status: string;
  returnValue?: StellarSdk.xdr.ScVal;
  resultXdr?: string;
  resultMetaXdr?: string;
  errorResultXdr?: string;
  [key: string]: any;
}

async function waitForTransaction(hash: string, maxAttempts = 30): Promise<TransactionResult> {
  let attempts = 0;
  let lastError: any = null;
  
  console.log(`Starting to wait for transaction ${hash} (max ${maxAttempts} attempts)`);
  
  while (attempts < maxAttempts) {
    try {
      console.log(`Checking transaction status (attempt ${attempts + 1}/${maxAttempts})...`);
      const response = await fetch(`${TESTNET_DETAILS.networkUrl}/transactions/${hash}`);
      
      if (response.ok) {
        const result = await response.json();
        console.log('Transaction status:', result.status, 'Ledger:', result.ledger_attr);
        
        if (result.status === 'SUCCESS' || result.status === 'FAILED') {
          console.log(`Transaction ${result.status} in ledger ${result.ledger_attr}`);
          
          if (result.result_meta_xdr) {
            try {
              const meta = StellarSdk.xdr.TransactionMeta.fromXDR(result.result_meta_xdr, 'base64');
              if (meta.v3 && meta.v3()?.sorobanMeta && meta.v3()?.sorobanMeta()?.returnValue) {
                return { 
                  ...result, 
                  status: result.status.toUpperCase(), 
                  returnValue: meta.v3()?.sorobanMeta()?.returnValue(), 
                  resultXdr: result.result_xdr, 
                  resultMetaXdr: result.result_meta_xdr 
                };
              }
            } catch (parseError) {
              console.warn('Error parsing transaction meta:', parseError);
            }
          }
          
          return { 
            ...result, 
            status: result.status.toUpperCase(), 
            resultXdr: result.result_xdr, 
            resultMetaXdr: result.result_meta_xdr 
          };
        }
      } else {
        const errorText = await response.text().catch(() => 'No error details');
        lastError = new Error(`HTTP ${response.status}: ${errorText}`);
        
        if (response.status === 404) {
          console.warn(`Transaction ${hash} not found (attempt ${attempts + 1}/${maxAttempts}).`);
        } else {
          console.warn(`Horizon error fetching tx ${hash}: ${response.status} - ${errorText}`);
        }
      }
    } catch (error) {
      lastError = error;
      console.error('Error checking transaction status:', error);
    }
    
    // Wait before next attempt (with exponential backoff, max 10s)
    const delay = Math.min(1000 * Math.pow(1.5, attempts), 10000);
    console.log(`Waiting ${delay}ms before next check...`);
    await new Promise(resolve => setTimeout(resolve, delay));
    attempts++;
  }
  
  const errorMessage = `Transaction ${hash} confirmation timeout after ${attempts} attempts.`;
  console.error(errorMessage, { lastError });
  const error = new Error(errorMessage);
  (error as any).lastError = lastError;
  throw error;
}


export async function sendTransaction(transaction: StellarSdk.Transaction): Promise<TransactionResult> {
  try {
    const tx = transaction;
    console.log('Transaction built successfully');

    // Convert to XDR for signing
    const txXdr = tx.toXDR();
    console.log('Transaction XDR created');

    // Sign the transaction with Freighter
    console.log('Sending transaction to Freighter for signing...');
    let signedTxXdr: string;
    
    const signResult = await freighterApi.signTransaction(
      txXdr,
      { networkPassphrase: TESTNET_DETAILS.networkPassphrase }
    );
    
    // Handle different return types from Freighter
    if (typeof signResult === 'string') {
      signedTxXdr = signResult;
    } else if (signResult && typeof signResult === 'object' && 'signedTxXdr' in signResult) {
      signedTxXdr = signResult.signedTxXdr;
    } else {
      throw new Error('Unexpected response from Freighter');
    }
    
    console.log('Transaction signed by Freighter');
    
    // Create form data for submission
    const formData = new URLSearchParams();
    formData.append('tx', signedTxXdr);
    
    // Submit the transaction to the network
    console.log('Submitting transaction to the network...');
    const response = await fetch(`${TESTNET_DETAILS.networkUrl}/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString(),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('Transaction submission failed raw response:', result);
      const errorTitle = result.title || 'Transaction Submission Error';
      const errorDetail = result.detail || response.statusText;
      let resultCodesInfo = '';
      if (result.extras && result.extras.result_codes) {
        resultCodesInfo = `Tx code: ${result.extras.result_codes.transaction}, Op codes: ${result.extras.result_codes.operations?.join(', ')}`;
      }
      throw new Error(`${errorTitle}: ${errorDetail}. ${resultCodesInfo}. Raw: ${JSON.stringify(result.extras)}`);
    }
    
    if (result.status === 'PENDING' || result.status === 'DUPLICATE' || !result.status) {
      console.log(`Transaction ${result.hash} submitted, status: ${result.status || 'UNKNOWN'}. Waiting for confirmation...`);
      return waitForTransaction(result.hash);
    } else if (result.status === 'SUCCESS' || result.status === 'FAILED') {
      console.log(`Transaction ${result.hash} processed quickly, status: ${result.status}.`);
       if (result.result_meta_xdr) {
            const meta = StellarSdk.xdr.TransactionMeta.fromXDR(result.result_meta_xdr, 'base64');
            const v3 = meta.v3?.();
            if (v3) {
                const sorobanMeta = v3.sorobanMeta?.();
                if (sorobanMeta?.returnValue) {
                    return { 
                        ...result, 
                        status: result.status.toUpperCase(), 
                        returnValue: sorobanMeta.returnValue, 
                        resultXdr: result.result_xdr, 
                        resultMetaXdr: result.result_meta_xdr 
                    };
                }
            }
        }
      return { ...result, status: result.status.toUpperCase(), resultXdr: result.result_xdr, resultMetaXdr: result.result_meta_xdr };
    }
    
    console.warn("Unknown transaction submission response status:", result);
    return { ...result, status: 'UNKNOWN' };

  } catch (error) {
    console.error('Error in sendTransaction:', error);
    throw error;
  }
}


// Helper function to add timeout to a promise
function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout>;
  
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`${message} (timeout after ${ms}ms)`));
    }, ms);
  });

  return Promise.race([
    promise.finally(() => clearTimeout(timeoutId)),
    timeoutPromise
  ]);
}

export async function callContractFunction(
  functionName: string,
  args: StellarSdk.xdr.ScVal[],
  sourceAddress: string,
  isReadOnly: boolean,
  timeoutMs: number = 120000 // 2 minutes default timeout
): Promise<StellarSdk.xdr.ScVal> {
  try {
    console.log(`Calling contract function: ${functionName}`, {
      source: sourceAddress,
      contractId: TESTNET_DETAILS.contractId,
      args: args.map(arg => StellarSdk.scValToNative(arg)),
      isReadOnly,
    });

    if (!StellarSdk.StrKey.isValidEd25519PublicKey(sourceAddress)) {
        throw new Error(`Invalid source address: ${sourceAddress}`);
    }
    // Contract ID validation for Soroban (can be a public key or hash)
    if (!TESTNET_DETAILS.contractId || TESTNET_DETAILS.contractId.length < 10) {
      throw new Error(`Invalid contract ID: ${TESTNET_DETAILS.contractId}`);
    }

    // Create a contract instance with the contract ID
    const contract = new StellarSdk.Contract(TESTNET_DETAILS.contractId);
    
    // Create a new operation for the contract call
    const operation = contract.call(functionName, ...args);

    // For read-only operations, we can just simulate the transaction
    if (isReadOnly) {
      console.log('Simulating read-only operation...');
      const account = await horizonServer.loadAccount(sourceAddress);
      const sourceAccount = new StellarSdk.Account(sourceAddress, account.sequenceNumber());
      
      const tx = new StellarSdk.TransactionBuilder(sourceAccount, {
        fee: StellarSdk.BASE_FEE,
        networkPassphrase: TESTNET_DETAILS.networkPassphrase
      })
        .addOperation(operation)
        .setTimeout(30)
        .build();
      
      const simulation = await server.simulateTransaction(tx);
      
      if ('error' in simulation) {
        throw new Error(`Simulation failed: ${JSON.stringify(simulation.error)}`);
      }
      
      if (simulation.result?.retval) {
        return simulation.result.retval;
      } else {
        // Return default values for voting-related functions if no return value
        if (functionName === 'has_voted') {
          return StellarSdk.xdr.ScVal.scvBool(false);
        } else if (functionName === 'get_vote_count') {
          return StellarSdk.xdr.ScVal.scvU32(0);
        }
        return StellarSdk.xdr.ScVal.scvVoid();
      }
    }

    // For state-modifying operations, build and send the actual transaction
    console.log('Preparing transaction...');
    
    // Get the latest account info
    const account = await horizonServer.loadAccount(sourceAddress);
    const sourceAccount = new StellarSdk.Account(sourceAddress, account.sequenceNumber());
    
    // Build the transaction
    const txBuilder = new StellarSdk.TransactionBuilder(sourceAccount, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: TESTNET_DETAILS.networkPassphrase
    });
    
    // Add the operation
    txBuilder.addOperation(operation).setTimeout(30);
    
    // Build the transaction
    const tx = txBuilder.build();
    
    // Simulate first to get Soroban data and fee
    console.log('Simulating transaction...');
    const simulation = await server.simulateTransaction(tx);
    
    if ('error' in simulation) {
      throw new Error(`Simulation failed: ${JSON.stringify(simulation.error)}`);
    }
    
    // Reload account to get the latest sequence number
    const latestAccount = await horizonServer.loadAccount(sourceAddress);
    const latestSource = new StellarSdk.Account(sourceAddress, latestAccount.sequenceNumber());
    
    // Calculate the final fee (base fee + resource fee)
    const baseFee = StellarSdk.BASE_FEE;
    const resourceFee = simulation.minResourceFee ? parseInt(simulation.minResourceFee) : 0;
    const totalFee = (parseInt(baseFee) + resourceFee).toString();
    
    console.log(`Transaction fees - Base: ${baseFee}, Resource: ${resourceFee}, Total: ${totalFee}`);
    
    // Build the transaction builder with basic info
    const finalTxBuilder = new StellarSdk.TransactionBuilder(latestSource, {
      fee: totalFee,
      networkPassphrase: TESTNET_DETAILS.networkPassphrase
    });
    
    // Add the operation and set timeout
    finalTxBuilder.addOperation(operation).setTimeout(30);
    
    // Handle Soroban data if available
    if (simulation.transactionData) {
      try {
        console.log('Raw transaction data from simulation:', simulation.transactionData);
        
        // Convert the transaction data to XDR format
        let xdrData: string;
        
        // If it's already an XDR string, use it directly
        if (typeof simulation.transactionData === 'string') {
          console.log('Using transaction data as XDR string');
          xdrData = simulation.transactionData;
        } 
        // If it's a SorobanDataBuilder, build it first
        else if (simulation.transactionData instanceof StellarSdk.SorobanDataBuilder) {
          console.log('Building Soroban data from builder');
          const sorobanData = simulation.transactionData as StellarSdk.SorobanDataBuilder;
          // Add resource fee if available
          if (simulation.minResourceFee) {
            sorobanData.setResourceFee(simulation.minResourceFee.toString());
          }
          xdrData = sorobanData.build().toXDR('base64');
        }
        // If it's an object with a toXDR method, use that
        else if (simulation.transactionData && typeof (simulation.transactionData as any).toXDR === 'function') {
          console.log('Converting transaction data to XDR');
          xdrData = (simulation.transactionData as any).toXDR();
        }
        // Otherwise, create a new SorobanDataBuilder
        else {
          console.log('Creating new SorobanDataBuilder with simulation data');
          const sorobanData = new StellarSdk.SorobanDataBuilder();
          
          // Add resource fee if available
          if (simulation.minResourceFee) {
            sorobanData.setResourceFee(simulation.minResourceFee.toString());
          }
          
          xdrData = sorobanData.build().toXDR('base64');
        }
        
        console.log('Setting Soroban data with XDR:', xdrData);
        finalTxBuilder.setSorobanData(xdrData);
      } catch (error) {
        console.error('Failed to set Soroban data:', error);
        throw new Error(`Failed to set Soroban transaction data: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    
    // Build the final transaction
    const finalTx = finalTxBuilder.build();
    const txXdr = finalTx.toXDR();
    
    console.log('Transaction built, signing with Freighter...');
    
    // Sign the transaction with Freighter
    console.log('Sending transaction to Freighter for signing...');
    const signResult = await freighterApi.signTransaction(
      txXdr,
      { networkPassphrase: TESTNET_DETAILS.networkPassphrase }
    );
    
    // Handle different return types from Freighter
    let signedTxXdr: string;
    if (typeof signResult === 'string') {
      signedTxXdr = signResult;
    } else if (signResult && typeof signResult === 'object' && 'signedTxXdr' in signResult) {
      signedTxXdr = signResult.signedTxXdr;
    } else {
      throw new Error('Unexpected response from Freighter');
    }
    
    console.log('Transaction signed, submitting to network...');
    
    // Submit the transaction with timeout
    console.log('Submitting transaction to the network...');
    
    const transactionPromise = (async () => {
      const formData = new URLSearchParams();
      formData.append('tx', signedTxXdr);
      
      const response = await fetch(`${TESTNET_DETAILS.networkUrl}/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString()
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        console.error('Transaction submission failed. Status:', response.status, 'Response:', result);
        
        // Extract more detailed error information if available
        let errorDetail = result.detail || response.statusText;
        if (result.extras?.result_codes) {
          errorDetail += `\nResult codes: ${JSON.stringify(result.extras.result_codes, null, 2)}`;
        }
        if (result.extras?.result_xdr) {
          errorDetail += `\nResult XDR: ${result.extras.result_xdr}`;
        }
        
        const error = new Error(`Transaction submission failed: ${errorDetail}`);
        // Attach additional error details for better debugging
        (error as any).extras = result.extras;
        (error as any).status = response.status;
        throw error;
      }
      
      const txHash = result.hash || (result as any).id;
      console.log(`Transaction submitted with hash: ${txHash}`);
      
      // Wait for transaction to complete with a separate timeout
      console.log('Waiting for transaction confirmation...');
      const txResult = await withTimeout(
        waitForTransaction(txHash),
        timeoutMs - 30000, // Reserve 30 seconds for the initial submission
        'Transaction confirmation timed out'
      );
      
      if (txResult.status !== 'SUCCESS') {
        console.error('Transaction failed:', txResult);
        throw new Error(`Transaction failed with status: ${txResult.status}`);
      }
      
      console.log('Transaction completed successfully');
      return txResult.returnValue || StellarSdk.xdr.ScVal.scvVoid();
    })();
    
    // Apply the overall timeout to the entire operation
    return await withTimeout(
      transactionPromise,
      timeoutMs,
      'Transaction processing timed out'
    );
    
  } catch (error) {
    let errorMessage = error instanceof Error ? error.message : String(error);
    
    // Add errorResultXdr if available (contains Soroban-specific error details)
    if (error && typeof error === 'object' && 'errorResultXdr' in error && typeof error.errorResultXdr === 'string') {
      try {
        const errorScVal = StellarSdk.xdr.ScVal.fromXDR(error.errorResultXdr as string, 'base64');
        errorMessage += `. Error details: ${JSON.stringify(StellarSdk.scValToNative(errorScVal))}`;
      } catch(e) { 
        console.warn("Could not parse errorResultXdr", e);
      }
    }
    
    console.error(`Error in callContractFunction ('${functionName}'):`, {
      error: errorMessage,
      source: sourceAddress,
      functionName,
      args: JSON.stringify(args.map(arg => StellarSdk.scValToNative(arg))),
      stack: error instanceof Error ? error.stack : undefined,
    });
    throw new Error(`Failed to call '${functionName}': ${errorMessage}`);
  }
}

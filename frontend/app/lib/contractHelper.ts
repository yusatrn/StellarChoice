import * as freighterApi from '@stellar/freighter-api';
import * as StellarSdk from '@stellar/stellar-sdk';
import { rpc as StellarRpc } from '@stellar/stellar-sdk';

// Create a server instance for the Stellar Testnet
export const server = new StellarRpc.Server('https://soroban-testnet.stellar.org');

const { 
  Transaction, 
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
  Soroban,
  xdr
} = StellarSdk;

// Import MemoType from Stellar SDK
import { MemoType } from '@stellar/stellar-sdk';

// Soroban RPC için tipler
type ScVal = StellarSdk.xdr.ScVal;
type Address = string;

// Ağ detayları
interface NetworkDetails {
  networkUrl: string;
  sorobanRpcUrl: string;
  networkPassphrase: string;
  contractId: string;
}

// Testnet detayları
const TESTNET_DETAILS: NetworkDetails = {
  networkUrl: 'https://horizon-testnet.stellar.org',
  sorobanRpcUrl: 'https://soroban-testnet.stellar.org',
  networkPassphrase: 'Test SDF Network ; September 2015',
  contractId: 'CAAQB4APN6C36C3E3XOKTBMFXEEXOQXPP3JJTB74P4KBYOVBMNL6DVWU'
};

// HTTP istekleri için yardımcı fonksiyon
// Soroban RPC istekleri için useSorobanRpc parametresi ekledik
async function makeRpcRequest<T = any>(endpoint: string, body: any, useSorobanRpc: boolean = false): Promise<T> {
  // Soroban RPC istekleri için ayrı URL kullan
  const baseUrl = useSorobanRpc 
    ? TESTNET_DETAILS.sorobanRpcUrl 
    : TESTNET_DETAILS.networkUrl;

  const response = await fetch(`${baseUrl}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`RPC hatası (${response.status}): ${error}`);
  }
  
  return response.json();
}

// İşlem gönder ve sonucu döndür
// @param transaction İmzalanmamış işlem
// @returns İşlem sonucu
export interface TransactionResult {
  status: string;
  returnValue?: StellarSdk.xdr.ScVal;
  resultXdr?: string;
  resultMetaXdr?: string;
  [key: string]: any;
}

export async function sendTransaction(transaction: any): Promise<TransactionResult> {
  try {
    // İmzalanmış işlemi al
    let signedTxXdr: string;
    try {
      const signedTxResult = await freighterApi.signTransaction(
        transaction.toXDR(),
        { networkPassphrase: TESTNET_DETAILS.networkPassphrase }
      );
      
      // Eğer signedTxResult bir nesne ise ve signedTxXdr özelliği varsa onu kullan
      signedTxXdr = (typeof signedTxResult === 'object' && 'signedTxXdr' in signedTxResult)
        ? (signedTxResult as { signedTxXdr: string }).signedTxXdr
        : signedTxResult as string;
    } catch (error) {
      console.error('Error signing transaction:', error);
      throw new Error('İşlem imzalanırken bir hata oluştu: ' + (error as Error).message);
    }
    
    // İmzalanmış işlemi ağa gönder
    const response = await fetch(`${TESTNET_DETAILS.networkUrl}/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `tx=${encodeURIComponent(signedTxXdr)}`
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Transaction submission failed: ${response.status} ${response.statusText} - ${errorText}`);
    }
    
    const result = await response.json();
    
    // İşlemin tamamlanmasını bekle
    if (result.status === 'PENDING' || result.status === 'DUPLICATE') {
      const txResult = await waitForTransaction(result.hash);
      
      // İşlem sonucunu işle
      if (txResult.status === 'SUCCESS' && txResult.resultXdr && txResult.resultMetaXdr) {
        try {
          const resultXdr = xdr.TransactionResult.fromXDR(txResult.resultXdr, 'base64');
          const resultMetaXdr = xdr.TransactionMeta.fromXDR(txResult.resultMetaXdr, 'base64');
          
          // Soroban meta verilerini kontrol et
          const v3Meta = resultMetaXdr.v3();
          if (v3Meta && v3Meta.sorobanMeta) {
            const sorobanMeta = v3Meta.sorobanMeta();
            if (sorobanMeta) {
              const returnVal = sorobanMeta.returnValue();
              if (returnVal) {
                return {
                  ...txResult,
                  returnValue: returnVal
                };
              }
            }
          }
          
          // Eğer işlem başarılıysa ve bir değer döndürdüyse
          if (resultXdr.result().results()?.length > 0) {
            const operationResult = resultXdr.result().results()?.[0];
            if (operationResult) {
              const invokeHostFunctionResult = operationResult.tr().invokeHostFunctionResult();
              if (invokeHostFunctionResult) {
                const success = invokeHostFunctionResult.success();
                if (success) {
                  // Soroban sözleşme çağrıları için dönüş değeri
                  const sorobanMeta = v3Meta.sorobanMeta?.();
                  if (sorobanMeta) {
                    const returnVal = sorobanMeta.returnValue?.();
                    if (returnVal) {
                      return {
                        ...txResult,
                        returnValue: returnVal
                      };
                    }
                  }
                  
                  // Eğer soroban meta yoksa, başarılı işlemi döndür
                  return {
                    ...txResult,
                    returnValue: xdr.ScVal.scvVoid()
                  };
                }
              }
            }
          }
        } catch (error) {
          console.error('Error processing transaction result:', error);
          // Hata olsa bile işlem sonucunu döndür
          return txResult;
        }
        
        return {
          ...txResult,
          returnValue: xdr.ScVal.scvVoid()
        };
      }
      
      return txResult;
    }
    
    return result;
  } catch (error) {
    console.error('Error sending transaction:', error);
    throw error;
  }
}

// İşlem durumunu kontrol etme
export async function getTransactionStatus(hash: string): Promise<string> {
  const response = await fetch(`${TESTNET_DETAILS.networkUrl}/transactions/${hash}`);
  if (!response.ok) {
    throw new Error('Failed to fetch transaction status');
  }
  const data = await response.json();
  return data.status;
}

// İşlemin tamamlanmasını bekle
async function waitForTransaction(hash: string, maxAttempts = 10): Promise<any> {
  let attempts = 0;
  while (attempts < maxAttempts) {
    try {
      const response = await fetch(`${TESTNET_DETAILS.networkUrl}/transactions/${hash}`);
      if (response.ok) {
        const result = await response.json();
        if (result.status === 'SUCCESS' || result.status === 'FAILED') {
          return result;
        }
      }
    } catch (error) {
      console.error('Error checking transaction status:', error);
    }
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    attempts++;
  }
  
  throw new Error('Transaction confirmation timeout');
}

// Yardımcı fonksiyon: Adresi ScVal'a dönüştür
function addressToScVal(address: string): StellarSdk.xdr.ScVal {
  return nativeToScVal(address, { type: 'address' });
}

// Sayısal değeri ScVal'a dönüştürme
function numberToScVal(value: number): StellarSdk.xdr.ScVal {
  return nativeToScVal(value, { type: 'u32' });
}

// Kontrat fonksiyonunu çağır
// @param functionName Çağrılacak fonksiyon adı
// @param args Fonksiyon argümanları (ScVal[] olarak)
// @param source İşlemi gönderen adres
// @returns İşlem sonucu (ScVal olarak)
export async function callContractFunction(
  functionName: string, 
  args: StellarSdk.xdr.ScVal[],
  source: string
): Promise<StellarSdk.xdr.ScVal> {
  try {
    console.log(`Calling contract function: ${functionName}`, {
      source,
      contractId: TESTNET_DETAILS.contractId,
      args: JSON.stringify(args)
    });

    // Validate contract ID
    if (!TESTNET_DETAILS.contractId || TESTNET_DETAILS.contractId === 'YOUR_CONTRACT_ID') {
      throw new Error('Contract ID is not set in the configuration. Please update contractHelper.ts with your deployed contract ID.');
    }

    // Validate source address
    if (!source) {
      throw new Error('Source address is required');
    }

    try {
      // Use the exported server instance to get the source account
      const sourceAccount = await server.getAccount(source);
      
      // Create contract instance
      const contract = new Contract(TESTNET_DETAILS.contractId);
      
      // Create operation - wrap in try/catch to catch function not found errors
      let operation;
      try {
        operation = contract.call(functionName, ...args);
      } catch (opError) {
        throw new Error(`Function '${functionName}' not found in contract or invalid arguments: ${opError}`);
      }
      
      // Build transaction
      const transaction = new TransactionBuilder(sourceAccount, {
        fee: BASE_FEE,
        networkPassphrase: TESTNET_DETAILS.networkPassphrase,
      })
        .addOperation(operation)
        .setTimeout(30)
        .build();
      
      console.log('Sending transaction...');
      let result;
      try {
        result = await sendTransaction(transaction);
      } catch (txError) {
        console.error('Transaction failed:', txError);
        throw new Error(`Transaction failed: ${txError instanceof Error ? txError.message : String(txError)}`);
      }
      
      console.log('Transaction result:', {
        status: result.status,
        hasReturnValue: !!result.returnValue,
        resultXdr: result.resultXdr,
        resultMetaXdr: result.resultMetaXdr
      });
      
      // If the transaction was successful but didn't return a value, return void
      if (!result.returnValue) {
        console.warn(`Function '${functionName}' did not return a value`);
        return xdr.ScVal.scvVoid();
      }
      
      return result.returnValue;
      
    } catch (innerError) {
      // Rethrow with more context
      console.error('Inner error in callContractFunction:', innerError);
      throw new Error(`Contract call failed: ${innerError instanceof Error ? innerError.message : String(innerError)}`);
    }
  } catch (error) {
    // Handle any unexpected errors
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Error in callContractFunction (${functionName}):`, {
      error: errorMessage,
      source,
      contractId: TESTNET_DETAILS.contractId,
      functionName,
      args: JSON.stringify(args),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    // Rethrow with a more descriptive message
    throw new Error(`Failed to call '${functionName}': ${errorMessage}`);
  }
}
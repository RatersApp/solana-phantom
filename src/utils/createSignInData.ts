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



export const createSignInData = async (): Promise<SolanaSignInInput> => {
    const now: Date = new Date();
    const uri = window.location.href
    const currentUrl = new URL(uri);
    const domain = currentUrl.host;
  
    // Convert the Date object to a string
    const currentDateTime = now.toISOString();
    const signInData: SolanaSignInInput = {
      domain,
      statement: "Clicking Sign or Approve only means you have proved this wallet is owned by you. This request will not trigger any blockchain transaction or cost any gas fee.",
      version: "1",
      nonce: "oBbLoEldZs",
      chainId: "devnet",
      issuedAt: currentDateTime,
      resources: ["https://solana-phantom.ratersapp.com", "https://phantom.app/"],
    };
  
    return signInData;
  };
  
  export const createSignInErrorData = async (): Promise<SolanaSignInInput> => {
    const now: Date = new Date();
  
    // Convert the Date object to a string
    const currentDateTime = now.toISOString();
    const signInData: SolanaSignInInput = {
      domain: "phishing.com",
      statement: "Sign-in to connect!",
      uri: "https://www.phishing.com",
      version: "1",
      nonce: "oBbLoEldZs",
      chainId: "solana:devnet",
      issuedAt: currentDateTime,
      resources: ["https://solana-phantom.ratersapp.com", "https://phantom.app/"]
    };
  
    return signInData;
  };

export function createSignInMessage(input: SolanaSignInInputWithRequiredFields): [string, Uint8Array] {
    const text = createSignInMessageText(input);
    return [text, new TextEncoder().encode(text)];
}

export type SolanaSignInInputWithRequiredFields = SolanaSignInInput &
    Required<Pick<SolanaSignInInput, 'domain' | 'address'>>;


export function createSignInMessageText(input: SolanaSignInInputWithRequiredFields): string {
    // ${domain} wants you to sign in with your Solana account:
    // ${address}
    //
    // ${statement}
    //
    // URI: ${uri}
    // Version: ${version}
    // Chain ID: ${chain}
    // Nonce: ${nonce}
    // Issued At: ${issued-at}
    // Expiration Time: ${expiration-time}
    // Not Before: ${not-before}
    // Request ID: ${request-id}
    // Resources:
    // - ${resources[0]}
    // - ${resources[1]}
    // ...
    // - ${resources[n]}

    let message = `${input.domain} wants you to sign in with your Solana account:\n`;
    message += `${input.address}`;

    if (input.statement) {
        message += `\n\n${input.statement}`;
    }

    const fields: string[] = [];
    if (input.uri) {
        fields.push(`URI: ${input.uri}`);
    }
    if (input.version) {
        fields.push(`Version: ${input.version}`);
    }
    if (input.chainId) {
        fields.push(`Chain ID: ${input.chainId}`);
    }
    if (input.nonce) {
        fields.push(`Nonce: ${input.nonce}`);
    }
    if (input.issuedAt) {
        fields.push(`Issued At: ${input.issuedAt}`);
    }
    if (input.expirationTime) {
        fields.push(`Expiration Time: ${input.expirationTime}`);
    }
    if (input.notBefore) {
        fields.push(`Not Before: ${input.notBefore}`);
    }
    if (input.requestId) {
        fields.push(`Request ID: ${input.requestId}`);
    }
    if (input.resources) {
        fields.push(`Resources:`);
        for (const resource of input.resources) {
            fields.push(`- ${resource}`);
        }
    }
    if (fields.length) {
        message += `\n\n${fields.join('\n')}`;
    }

    return message;
}
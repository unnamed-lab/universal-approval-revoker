import type {
  Approval,
  TokenDelegation,
  EvmChainResult,
  EvmAllowance,
} from "@uar/shared";

/**
 * Map a Solana TokenDelegation to the unified Approval type.
 */
export function toApproval(d: TokenDelegation): Approval {
  return {
    id: `solana:solana:${d.mint}:${d.delegate}`,
    ecosystem: "solana",
    chain: "solana",
    spender: d.delegate,
    spenderName: d.risk.knownProtocolName,
    amount: d.delegatedAmount,
    amountFormatted: d.delegatedAmountUi,
    tokenAddress: d.mint,
    metadata: d.metadata,
    risk: d.risk,
    solana: { tokenProgram: d.tokenProgram },
  };
}

/**
 * Map an EVM allowance to the unified Approval type.
 */
export function toEVMApproval(
  chain: EvmChainResult,
  a: EvmAllowance,
): Approval {
  const chainName = chainNameById(chain.chainId);
  return {
    id: `evm:${chainName}:${a.tokenAddress}:${a.spender}`,
    ecosystem: "evm",
    chain: chainName,
    chainId: chain.chainId,
    spender: a.spender,
    spenderName: a.risk.knownProtocolName,
    amount: a.allowance,
    amountFormatted: a.allowanceFormatted,
    tokenAddress: a.tokenAddress,
    metadata: {
      symbol: a.tokenSymbol,
      name: a.tokenName,
      decimals: a.tokenDecimals,
      logoUri: a.tokenLogoUri,
    },
    risk: a.risk,
    evm: { owner: "" }, // populated by the caller if needed
  };
}

function chainNameById(id: number): string {
  switch (id) {
    case 1:
      return "ethereum";
    case 8453:
      return "base";
    case 42161:
      return "arbitrum";
    default:
      return `evm-${id}`;
  }
}

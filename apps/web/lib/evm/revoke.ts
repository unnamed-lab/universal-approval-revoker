"use client";

import {
  type Address,
  type WalletClient,
  type PublicClient,
  encodeFunctionData,
} from "viem";
import type { Approval } from "@uar/shared";
import { api } from "../api";

/* ─── Constants ─── */

const MULTICALL3_ADDRESS = "0xcA11bde05977b3631167028862bE2a173976CA11";

const PERMIT_FRAGMENT = [
  {
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
      { name: "value", type: "uint256" },
      { name: "deadline", type: "uint256" },
      { name: "v", type: "uint8" },
      { name: "r", type: "bytes32" },
      { name: "s", type: "bytes32" },
    ],
    name: "permit",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

const APPROVE_FRAGMENT = [
  {
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

const NONCES_FRAGMENT = [
  {
    inputs: [{ name: "owner", type: "address" }],
    name: "nonces",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

const NAME_FRAGMENT = [
  {
    inputs: [],
    name: "name",
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

/* ─── Types ─── */

export interface EvmRevokeResult {
  txHash: string;
  chainId: number;
  revokedAddresses: string[];
}

interface PermitSignature {
  tokenAddress: Address;
  spender: Address;
  v: number;
  r: `0x${string}`;
  s: `0x${string}`;
}

/* ─── Public API ─── */

/**
 * Batch-revoke EVM approvals.
 *
 * 1. Permit tokens → sign N permits, bundle into 1 Multicall3 tx.
 * 2. Non-permit tokens → sequential approve(spender, 0), one popup each.
 */
export async function evmBatchRevoke(
  walletClient: WalletClient,
  publicClient: PublicClient,
  owner: Address,
  approvals: Approval[],
  chainId: number,
  onProgress?: (msg: string) => void,
): Promise<EvmRevokeResult[]> {
  if (approvals.length === 0) return [];

  if (!walletClient.account) throw new Error("Wallet not connected");
  const account = walletClient.account;
  const results: EvmRevokeResult[] = [];

  // 1. Check permit support for each approval
  const checks = await Promise.all(
    approvals.map(async (a) => {
      if (!a.evm) return { approval: a, supportsPermit: false };
      try {
        const res = await api.evmPermitCheck(a.tokenAddress, chainId);
        return { approval: a, supportsPermit: res.supportsPermit };
      } catch {
        return { approval: a, supportsPermit: false };
      }
    }),
  );

  const permitAble = checks.filter((c) => c.supportsPermit);
  const nonPermit = checks.filter((c) => !c.supportsPermit);

  // 2. Batch permit tokens via Multicall3
  if (permitAble.length > 0) {
    onProgress?.(
      `Signing ${permitAble.length} permit message${permitAble.length > 1 ? "s" : ""}…`,
    );

    // Sign each permit and build Multicall3 calldata
    const calls: { target: Address; callData: `0x${string}` }[] = [];

    for (const { approval } of permitAble) {
      const sig = await signPermitRevoke(
        walletClient,
        publicClient,
        owner,
        approval.tokenAddress as Address,
        approval.spender as Address,
        approval.metadata.name,
        chainId,
      );

      calls.push({
        target: approval.tokenAddress as Address,
        callData: encodeFunctionData({
          abi: PERMIT_FRAGMENT,
          functionName: "permit",
          args: [owner, sig.spender, 0n, sig.deadline, sig.v, sig.r, sig.s],
        }),
      });
    }

    onProgress?.("Submitting batch revoke transaction…");

    const AGGREGATE_ABI = [
      {
        type: "function",
        name: "aggregate",
        inputs: [
          {
            type: "tuple(address,bytes)[]",
            components: [
              { type: "address", name: "target" },
              { type: "bytes", name: "callData" },
            ],
          },
        ],
        outputs: [
          { type: "uint256", name: "blockNumber" },
          { type: "bytes[]", name: "returnData" },
        ],
      },
    ] as const;

    const txHash = await walletClient.sendTransaction({
      account,
      chain: undefined,
      to: MULTICALL3_ADDRESS,
      data: encodeFunctionData({
        abi: AGGREGATE_ABI,
        functionName: "aggregate",
        args: [calls],
      }),
    });

    onProgress?.("Confirming batch transaction…");
    await publicClient.waitForTransactionReceipt({ hash: txHash });

    results.push({
      txHash,
      chainId,
      revokedAddresses: permitAble.map((c) => c.approval.tokenAddress),
    });
  }

  // 3. Sequential approve(0) for non-permit tokens
  for (const { approval } of nonPermit) {
    if (!approval.evm) continue;

    onProgress?.(
      `Revoking ${approval.metadata.symbol} (${results.length + 1}/${checks.length})…`,
    );

    const txHash = await walletClient.sendTransaction({
      account,
      chain: undefined,
      to: approval.tokenAddress as Address,
      data: encodeFunctionData({
        abi: APPROVE_FRAGMENT,
        functionName: "approve",
        args: [approval.spender as Address, 0n],
      }),
    });

    await publicClient.waitForTransactionReceipt({ hash: txHash });

    results.push({
      txHash,
      chainId,
      revokedAddresses: [approval.tokenAddress],
    });
  }

  return results;
}

/* ─── Permit signing helpers ─── */

async function signPermitRevoke(
  walletClient: WalletClient,
  publicClient: PublicClient,
  owner: Address,
  tokenAddress: Address,
  spender: Address,
  tokenName: string,
  chainId: number,
): Promise<PermitSignature & { deadline: bigint }> {
  if (!walletClient.account) throw new Error("Wallet not connected");
  // Get current nonce
  const nonce = await publicClient.readContract({
    address: tokenAddress,
    abi: NONCES_FRAGMENT,
    functionName: "nonces",
    args: [owner],
  });

  // Try to get token name for EIP-712 domain
  let name: string;
  if (tokenName && tokenName !== "Unknown Token" && tokenName !== "UNKNOWN") {
    name = tokenName;
  } else {
    try {
      name = (await publicClient.readContract({
        address: tokenAddress,
        abi: NAME_FRAGMENT,
        functionName: "name",
        args: [],
      })) as string;
    } catch {
      name = "Token";
    }
  }

  const deadline = BigInt(Math.floor(Date.now() / 1000) + 3600); // +1 hour

  const signature = await walletClient.signTypedData({
    account: walletClient.account,
    domain: {
      name,
      version: "1",
      chainId,
      verifyingContract: tokenAddress,
    },
    types: {
      Permit: [
        { name: "owner", type: "address" },
        { name: "spender", type: "address" },
        { name: "value", type: "uint256" },
        { name: "nonce", type: "uint256" },
        { name: "deadline", type: "uint256" },
      ],
    },
    primaryType: "Permit",
    message: {
      owner,
      spender,
      value: 0n,
      nonce,
      deadline,
    },
  });

  // Split signature into v, r, s
  const sig = signature.slice(2);
  const r = `0x${sig.slice(0, 64)}` as `0x${string}`;
  const s = `0x${sig.slice(64, 128)}` as `0x${string}`;
  const v = parseInt(sig.slice(128, 130), 16);

  return { tokenAddress, spender, deadline, v, r, s };
}

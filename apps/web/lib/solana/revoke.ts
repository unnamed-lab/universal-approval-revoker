import {
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import {
  createRevokeInstruction,
  TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
} from "@solana/spl-token";
/** Max revokes to pack into a single transaction before splitting. */
const BATCH_SIZE = 10;

export interface RevokeTarget {
  tokenAccount: string;
  tokenProgram: "spl-token" | "spl-token-2022";
}

export interface RevokeResult {
  signature: string;
  revokedAccounts: string[];
}

/**
 * Optional fee collected per batch transaction.
 * A SystemProgram.transfer to treasuryAddress is bundled into the same
 * transaction as the Revoke instructions — no extra wallet popup.
 */
export interface FeeConfig {
  /** Base58 address of the treasury wallet. */
  treasuryAddress: string;
  /** Fee in lamports (e.g. 1_000_000 = 0.001 SOL). */
  lamports: number;
}

/**
 * Builds and sends one or more transactions to revoke all provided targets.
 * Each transaction holds up to BATCH_SIZE Revoke instructions.
 */
export async function batchRevoke(
  connection: Connection,
  owner: PublicKey,
  targets: RevokeTarget[],
  sendTransaction: (tx: Transaction, connection: Connection) => Promise<string>,
  feeConfig?: FeeConfig | null,
): Promise<RevokeResult[]> {
  if (targets.length === 0) return [];

  const results: RevokeResult[] = [];
  const { blockhash, lastValidBlockHeight } =
    await connection.getLatestBlockhash();

  const treasury = feeConfig
    ? new PublicKey(feeConfig.treasuryAddress)
    : null;

  for (let i = 0; i < targets.length; i += BATCH_SIZE) {
    const batch = targets.slice(i, i + BATCH_SIZE);
    const tx = new Transaction({ recentBlockhash: blockhash, feePayer: owner });

    if (treasury && feeConfig && feeConfig.lamports > 0) {
      tx.add(
        SystemProgram.transfer({
          fromPubkey: owner,
          toPubkey: treasury,
          lamports: feeConfig.lamports,
        }),
      );
    }

    for (const target of batch) {
      const tokenProgramId =
        target.tokenProgram === "spl-token-2022"
          ? TOKEN_2022_PROGRAM_ID
          : TOKEN_PROGRAM_ID;

      const instruction: TransactionInstruction = createRevokeInstruction(
        new PublicKey(target.tokenAccount),
        owner,
        [],
        tokenProgramId,
      );
      tx.add(instruction);
    }

    const signature = await sendTransaction(tx, connection);

    await connection.confirmTransaction(
      { signature, blockhash, lastValidBlockHeight },
      "confirmed",
    );

    results.push({
      signature,
      revokedAccounts: batch.map((t) => t.tokenAccount),
    });
  }

  return results;
}

/**
 * Revoke a single target.
 */
export async function singleRevoke(
  connection: Connection,
  owner: PublicKey,
  target: RevokeTarget,
  sendTransaction: (tx: Transaction, connection: Connection) => Promise<string>,
): Promise<RevokeResult> {
  const [result] = await batchRevoke(connection, owner, [target], sendTransaction);
  return result!;
}

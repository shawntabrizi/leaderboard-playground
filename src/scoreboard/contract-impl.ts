import { createCdm } from "@dotdm/cdm";
import { sr25519CreateDerive } from "@polkadot-labs/hdkd";
import {
  DEV_PHRASE,
  entropyToMiniSecret,
  mnemonicToEntropy,
} from "@polkadot-labs/hdkd-helpers";
import { getPolkadotSigner } from "polkadot-api/signer";
import cdmJson from "../../cdm.json";
import type { ScoreboardAPI, ScoreEntry } from "./api";

const CONTRACT_NAME = "@example/leaderboard-playground";

function getDevSigner() {
  const entropy = mnemonicToEntropy(DEV_PHRASE);
  const miniSecret = entropyToMiniSecret(entropy);
  const derive = sr25519CreateDerive(miniSecret);
  const alice = derive("//Alice");
  return getPolkadotSigner(alice.publicKey, "Sr25519", alice.sign);
}

function isContractDeployed(): boolean {
  const target = Object.keys((cdmJson as { contracts?: Record<string, unknown> }).contracts ?? {})[0];
  if (!target) return false;
  const contracts = (cdmJson as { contracts: Record<string, Record<string, unknown>> }).contracts;
  return Boolean(contracts[target]?.[CONTRACT_NAME]);
}

let _cdm: ReturnType<typeof createCdm> | null = null;
function cdm() {
  if (!_cdm) {
    _cdm = createCdm(cdmJson, { defaultSigner: getDevSigner() });
  }
  return _cdm;
}

interface LeaderboardContract {
  submitScore: { tx: (name: string, score: bigint) => Promise<unknown> };
  getBest: {
    query: (name: string) => Promise<{ success: boolean; value: bigint }>;
  };
  getNameCount: {
    query: () => Promise<{ success: boolean; value: number }>;
  };
  getEntryAt: {
    query: (
      index: number,
    ) => Promise<{ success: boolean; value: { name: string; score: bigint } }>;
  };
}

function contract(): LeaderboardContract {
  // The generated CDM type for this contract isn't available until after
  // `cdm install` has written .cdm/cdm.d.ts, so we cast to a local interface.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (cdm() as any).getContract(CONTRACT_NAME) as LeaderboardContract;
}

export const contractScoreboard: ScoreboardAPI = {
  async submitScore(player, score) {
    if (!isContractDeployed()) {
      throw new Error(
        `Contract ${CONTRACT_NAME} is not in cdm.json. Run \`cdm deploy -n paseo && cdm install ${CONTRACT_NAME} -n paseo\` first.`,
      );
    }
    await contract().submitScore.tx(player, BigInt(score));
  },

  async getTopScores(limit = 10) {
    if (!isContractDeployed()) return [];
    const c = contract();
    const countRes = await c.getNameCount.query();
    const count = countRes.success ? countRes.value : 0;
    if (count === 0) return [];
    const entries: ScoreEntry[] = [];
    for (let i = 0; i < count; i++) {
      const r = await c.getEntryAt.query(i);
      if (!r.success) continue;
      entries.push({
        player: r.value.name,
        score: Number(r.value.score),
        timestamp: 0,
      });
    }
    entries.sort((a, b) => b.score - a.score);
    return entries.slice(0, limit);
  },

  async getPlayerBest(player) {
    if (!isContractDeployed()) return null;
    const r = await contract().getBest.query(player);
    if (!r.success) return null;
    const v = Number(r.value);
    return v === 0 ? null : v;
  },
};

export const isLeaderboardContractDeployed = isContractDeployed;

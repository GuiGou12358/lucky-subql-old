import { SubstrateEvent } from "@subql/types";
import { WasmEvent } from "@subql/substrate-wasm-processor";

import {
	Account,
	Stake,
	DeveloperReward,
	DappStakingEra,
	PalletInfo,
	RaffleDone,
	Reward,
	RewardsClaimed
} from "../types";

import { Balance, AccountId } from "@polkadot/types/interfaces";

// SHIBUYA
//const DAPPSTAKING_CONTRACT_ID = "Xz3sHvmRgRY3mt3qQ3SjZ3aUPQTfHkj4rKeoQM6VJrenD3W";
//const DAPPSTAKING_DEVELOPER_ID = "WayJSoeDvHLJ8rXPqrPyQQwznntbxvjwvmq1AKBpu9phYHr";

// SHIDEN
const DAPPSTAKING_CONTRACT_ID = "X6ykUS6L6CH4EoZitZsYJsCxH2AGk2ky9G6a2xeu1W9ffTP";
const DAPPSTAKING_DEVELOPER_ID = "aqcmQUATZiaHmZtueE5chfSZRTvsvtSpmx57fZBhktDt4Rm";

async function getCurrentEra(): Promise<bigint> {
	let currentEra = BigInt(0);
    let palletInfo = await PalletInfo.get('0');
    if (palletInfo) {
		currentEra = palletInfo.currentEra;
    }
	return currentEra;
}

async function getAccount(accountId: string): Promise<Account> {
    let userAccount = await Account.get(accountId);
    if (!userAccount) {
		userAccount = new Account(accountId);
		userAccount.totalStake = BigInt(0);
		userAccount.totalRewards = BigInt(0);
		userAccount.totalClaimed = BigInt(0);
		userAccount.totalPending = BigInt(0);
    }
	return userAccount;
}



export async function bondAndStake(event: SubstrateEvent): Promise<void> {
    const {
        event: {
            data: [account, smartContract, balanceOf],
        },
    } = event;

    if (!smartContract.toString().includes(DAPPSTAKING_CONTRACT_ID)){
		return;
    }

    await logger.info("---------- DappsStaking - BondAndStake --------- ");

    const amount = (balanceOf as Balance).toBigInt();

    let userAccount = await getAccount(account.toString());
	userAccount.totalStake += amount;
	await userAccount.save();

	let stake = new Stake(`${event.block.block.header.number.toNumber()}-${event.idx}`);
	stake.accountId = account.toString();
	stake.amount = amount;
	stake.era = await getCurrentEra();
	stake.blockNumber = event.block.block.header.number.toBigInt();
	await stake.save();

}


export async function unbondAndUnstake(event: SubstrateEvent): Promise<void> {
    const {
        event: {
            data: [account, smartContract, balanceOf],
        },
    } = event;

    if (!smartContract.toString().includes(DAPPSTAKING_CONTRACT_ID)){
		return;
    }

	await logger.info("---------- DappsStaking - UnbondAndUnstake --------- ");

    const amount = (balanceOf as Balance).toBigInt();

    let userAccount = await getAccount(account.toString());
	userAccount.totalStake -= amount;
	await userAccount.save();

	let stake = new Stake(`${event.block.block.header.number.toNumber()}-${event.idx}`);
	stake.accountId = account.toString();
	stake.amount = -amount;
	stake.era = await getCurrentEra();
	stake.blockNumber = event.block.block.header.number.toBigInt();
	await stake.save();
}


export async function nominationTransfer(event: SubstrateEvent): Promise<void> {
    const {
        event: {
            data: [account, originSmartContract, balanceOf, targetSmartContract],
        },
    } = event;

    if (!originSmartContract.toString().includes(DAPPSTAKING_CONTRACT_ID)
		&& !targetSmartContract.toString().includes(DAPPSTAKING_CONTRACT_ID)
	){
		return;
    }

    let userAccount = await getAccount(account.toString());

	const amount = (balanceOf as Balance).toBigInt();

    if (targetSmartContract.toString().includes(DAPPSTAKING_CONTRACT_ID)){
    	await logger.info("---------- DappsStaking - nominationTransferIn --------- ");

		userAccount.totalStake += amount;
		await userAccount.save();

		let stake = new Stake(`${event.block.block.header.number.toNumber()}-${event.idx}`);
		stake.accountId = account.toString();
		stake.amount = amount;
		stake.era = await getCurrentEra();
		stake.blockNumber = event.block.block.header.number.toBigInt();
		await stake.save();

    } else if (originSmartContract.toString().includes(DAPPSTAKING_CONTRACT_ID)){
    	await logger.info("---------- DappsStaking - nominationTransferOut --------- ");

		userAccount.totalStake -= amount;
		await userAccount.save();

		let stake = new Stake(`${event.block.block.header.number.toNumber()}-${event.idx}`);
		stake.accountId = account.toString();
		stake.amount = -amount;
		stake.era = await getCurrentEra();
		stake.blockNumber = event.block.block.header.number.toBigInt();
		await stake.save();

    } else {
    	await logger.info("---------- DappsStaking - nominationTransfer ERROR --------- ");
    	await logger.info(event.block.block.header.hash.toString());
	}
}


export async function reward(event: SubstrateEvent): Promise<void> {
    const {
        event: {
            data: [account, smartContract, era, balanceOf],
        },
    } = event;

    if (!smartContract.toString().includes(DAPPSTAKING_CONTRACT_ID)){
		return;
    }

	if (!account.toString().includes(DAPPSTAKING_DEVELOPER_ID)){
		return;
    }

    await logger.info("---------- DappsStaking - Reward --------- ");

	/* save the developer account the first time to avoid an error with FK */
    let developerAccount = await Account.get(account.toString());
    if (!developerAccount) {
		developerAccount = new Account(account.toString());
		developerAccount.totalStake = BigInt(0);
		developerAccount.totalRewards = BigInt(0);
		developerAccount.totalClaimed = BigInt(0);
		developerAccount.totalPending = BigInt(0);
		await developerAccount.save();
    }

    const amount = (balanceOf as Balance).toBigInt();

	let reward = new DeveloperReward(`${event.block.block.header.number.toNumber()}-${event.idx}`);
	reward.accountId = account.toString();
	reward.amount = amount;
	reward.era = BigInt(era.toString());
	await reward.save();
}

export async function newDappStakingEra(event: SubstrateEvent): Promise<void> {
    const {
        event: {
            data: [era],
        },
    } = event;

    await logger.info("---------- DappsStaking - New DappStaking Era --------- ");

	let newEra = BigInt(era.toString());
	let dappStakingEra = new DappStakingEra(`${event.block.block.header.number.toNumber()}-${event.idx}`);
	dappStakingEra.era = newEra;
	dappStakingEra.blockNumber = event.block.block.header.number.toBigInt();
	await dappStakingEra.save();

    let palletInfo = await PalletInfo.get('0');
    if (!palletInfo) {
		palletInfo = new PalletInfo('0');
    }
	palletInfo.currentEra = newEra;
	await palletInfo.save();

}


type RaffleDoneEvent = [AccountId, BigInt, Balance, BigInt, BigInt, Balance] & {
	contract: AccountId,
	era: BigInt,
	pendingRewards: Balance,
	nbWinners: BigInt,
	nbParticipants: BigInt,
	totalValue: Balance,
}

export async function raffleDone(event: WasmEvent<RaffleDoneEvent>): Promise<void> {

    await logger.info("---------- Raffle Done  --------- ");

	const [contract, era, pendingRewards, nbWinners, nbParticipants, totalValue] = event.args;
    //await logger.info("contract: " + contract);
    //await logger.info("era: " + era);
    //await logger.info("pendingRewards: " + pendingRewards);
    //await logger.info("nbWinners: " + nbWinners);
    //await logger.info("nbParticipants: " + nbParticipants);
    //await logger.info("totalValue: " + totalValue);

	let raffleDone = new RaffleDone(`${event.blockNumber.valueOf()}-${event.eventIndex.valueOf()}`);
	raffleDone.era = era.valueOf();
	raffleDone.nb_winners = nbWinners.valueOf();
	raffleDone.total_rewards = pendingRewards.toBigInt();
	raffleDone.nb_participants = nbParticipants.valueOf();
	raffleDone.total_value = totalValue.toBigInt();
	await raffleDone.save();

}


type PendingRewardEvent = [AccountId, BigInt, Balance] & {
	account: AccountId,
	era: BigInt,
	amount: Balance,
}

export async function pendingReward(event: WasmEvent<PendingRewardEvent>): Promise<void> {

    await logger.info("---------- Pending Reward --------- ");

	const [account, era, amount] = event.args;
    //await logger.info("account: " + account);
    //await logger.info("era: " + era);
    //await logger.info("amount: " + amount);

    let userAccount = await getAccount(account.toString());
	userAccount.totalRewards += amount.toBigInt();
	userAccount.totalPending += amount.toBigInt();
	await userAccount.save();

	let reward = new Reward(`${event.blockNumber.valueOf()}-${event.eventIndex.valueOf()}`);
	reward.accountId = account.toString();
	reward.era = era.valueOf();
	reward.amount = amount.toBigInt();
	await reward.save();

}


type RewardsClaimedEvent = [AccountId, Balance] & {
	account: AccountId,
	amount: Balance,
}

export async function rewardsClaimed(event: WasmEvent<RewardsClaimedEvent>): Promise<void> {

    await logger.info("---------- Rewards Claimed --------- ");

	const [account, amount] = event.args;
    //await logger.info("account: " + account);
    //await logger.info("amount: " + amount);

    let userAccount = await getAccount(account.toString());
	userAccount.totalClaimed += amount.toBigInt();
	userAccount.totalPending -= amount.toBigInt();
	await userAccount.save();

	let rewardsClaimed = new RewardsClaimed(`${event.blockNumber.valueOf()}-${event.eventIndex.valueOf()}`);
	rewardsClaimed.accountId = account.toString();
	rewardsClaimed.amount = amount.toBigInt();
	await rewardsClaimed.save();

}
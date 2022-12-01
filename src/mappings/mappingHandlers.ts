import {
	SubstrateEvent,
} from "@subql/types";

import {
	Account,
	Stake,
	DeveloperReward,
	DappStakingEra,
	PalletInfo
} from "../types";

import {
	Balance
} from "@polkadot/types/interfaces";

const DAPPSTAKING_CONTRACT_ID = "bc3yCAej7WxPBi4x1Ba1zru9HtieZrW7jk15QmGWSwZ7D6G";
//const DAPPSTAKING_DEVELOPER_ID = "bgs2XegEVdJa1dgVmBichw9mLRkfrJRgnV6YX4LESGF6CJz";


async function getCurrentEra(): Promise<bigint> {
	let currentEra = BigInt(0);
    let palletInfo = await PalletInfo.get('0');
    if (palletInfo) {
		currentEra = palletInfo.currentEra;
    }
	return currentEra;
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

    let userAccount = await Account.get(account.toString());
    if (!userAccount) {
		userAccount = new Account(account.toString());
		userAccount.totalStake = BigInt(0);
    }
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

    let userAccount = await Account.get(account.toString());
    if (!userAccount) {
		userAccount = new Account(account.toString());
		userAccount.totalStake = BigInt(0);
    }
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

    let userAccount = await Account.get(account.toString());
    if (!userAccount) {
		userAccount = new Account(account.toString());
		userAccount.totalStake = BigInt(0);
    }

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
		await logger.info("SmartContract: " + smartContract.toString());
		return;
    }

    await logger.info("---------- DappsStaking - Reward --------- ");

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
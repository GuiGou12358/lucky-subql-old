import {
	SubstrateEvent,
} from "@subql/types";

import {
	Account,
	Stake,
	BondAndStake,
	UnbondAndUnstake,
	NominationTransferIn,
	NominationTransferOut,
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
	//await logger.info(event.block.block.header.hash.toString());
	//await logger.info(event.block.block.header.number.toNumber() + " - " + event.idx);
	//await logger.info("SmartContract: " + smartContract.toString());
	//await logger.info("AccountId: " + account.toString());
	//await logger.info("BalanceOf: " + balanceOf);



    const amount = (balanceOf as Balance).toBigInt();

    let userAccount = await Account.get(account.toString());
    if (!userAccount) {
		userAccount = new Account(account.toString());
		userAccount.totalStake = BigInt(0);
    }
	userAccount.totalStake += amount;
	await userAccount.save();

	let bondAndStake = new BondAndStake(`${event.block.block.header.number.toNumber()}-${event.idx}`);
	bondAndStake.accountId = account.toString();
	bondAndStake.amount = amount;
	bondAndStake.era = await getCurrentEra();
	bondAndStake.blockNumber = event.block.block.header.number.toBigInt();
	await bondAndStake.save();


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
	//await logger.info(event.block.block.header.hash.toString());
	//await logger.info(event.block.block.header.number.toNumber());
	//await logger.info(event.idx);
	//await logger.info("SmartContract: " + smartContract.toString());
	//await logger.info("AccountId: " + account.toString());
	//await logger.info("BalanceOf: " + balanceOf);

    const amount = (balanceOf as Balance).toBigInt();

    let userAccount = await Account.get(account.toString());
    if (!userAccount) {
		userAccount = new Account(account.toString());
		userAccount.totalStake = BigInt(0);
    }
	userAccount.totalStake -= amount;
	await userAccount.save();

	let unstake = new UnbondAndUnstake(`${event.block.block.header.number.toNumber()}-${event.idx}`);
	unstake.accountId = account.toString();
	unstake.amount = amount;
	unstake.era = await getCurrentEra();
	unstake.blockNumber = event.block.block.header.number.toBigInt();
	await unstake.save();

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
		//await logger.info("SmartContract: " + targetSmartContract.toString());
    	//await logger.info(event.block.block.header.hash.toString());
    	//await logger.info("AccountId: " + account.toString());
		//await logger.info("BalanceOf: " + balanceOf);

		userAccount.totalStake += amount;
		await userAccount.save();

		let transfer = new NominationTransferIn(`${event.block.block.header.number.toNumber()}-${event.idx}`);
		transfer.accountId = account.toString();
		transfer.amount = amount;
		transfer.era = await getCurrentEra();
		transfer.blockNumber = event.block.block.header.number.toBigInt();
		await transfer.save();

		let stake = new Stake(`${event.block.block.header.number.toNumber()}-${event.idx}`);
		stake.accountId = account.toString();
		stake.amount = amount;
		stake.era = await getCurrentEra();
		stake.blockNumber = event.block.block.header.number.toBigInt();
		await stake.save();

    } else if (originSmartContract.toString().includes(DAPPSTAKING_CONTRACT_ID)){
    	await logger.info("---------- DappsStaking - nominationTransferOut --------- ");
    	//await logger.info(event.block.block.header.hash.toString());
		//await logger.info("SmartContract: " + originSmartContract.toString());
    	//await logger.info("AccountId: " + account.toString());
    	//await logger.info("BalanceOf: " + balanceOf);

		userAccount.totalStake -= amount;
		await userAccount.save();

		let transfer = new NominationTransferOut(`${event.block.block.header.number.toNumber()}-${event.idx}`);
		transfer.accountId = account.toString();
		transfer.amount = amount;
		transfer.era = await getCurrentEra();
		transfer.blockNumber = event.block.block.header.number.toBigInt();
		await transfer.save();

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

    await logger.info("---------- DappsStaking - Reward --------- ");
    if (!smartContract.toString().includes(DAPPSTAKING_CONTRACT_ID)){
		await logger.info("SmartContract: " + smartContract.toString());
		return;
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
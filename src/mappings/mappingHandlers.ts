import {
	SubstrateEvent,
} from "@subql/types";

import {
	Account,
	BondAndStake,
	UnbondAndUnstake,
	NominationTransferIn,
	NominationTransferOut
} from "../types";

import {
	Balance
} from "@polkadot/types/interfaces";

const TARGET_CONTRACT = "0xd59fc6bfd9732ab19b03664a45dc29b8421bda9a";

export async function bondAndStake(event: SubstrateEvent): Promise<void> {
    const {
        event: {
            data: [account, smartContract, balanceOf],
        },
    } = event;

    if (!smartContract.toString().includes(TARGET_CONTRACT)){
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

	let stake = new BondAndStake(`${event.block.block.header.number.toNumber()}-${event.idx}`);
	stake.accountId = account.toString();
	stake.amount = amount;
	await stake.save();
}


export async function unbondAndUnstake(event: SubstrateEvent): Promise<void> {
    const {
        event: {
            data: [account, smartContract, balanceOf],
        },
    } = event;

    if (!smartContract.toString().includes(TARGET_CONTRACT)){
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
	await unstake.save();
}


export async function nominationTransfer(event: SubstrateEvent): Promise<void> {
    const {
        event: {
            data: [account, originSmartContract, balanceOf, targetSmartContract],
        },
    } = event;

    if (!originSmartContract.toString().includes(TARGET_CONTRACT)
		&& !targetSmartContract.toString().includes(TARGET_CONTRACT)
	){
		return;
    }

    let userAccount = await Account.get(account.toString());
    if (!userAccount) {
		userAccount = new Account(account.toString());
		userAccount.totalStake = BigInt(0);
    }

	const amount = (balanceOf as Balance).toBigInt();

    if (targetSmartContract.toString().includes(TARGET_CONTRACT)){
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
		await transfer.save();

    } else if (originSmartContract.toString().includes(TARGET_CONTRACT)){
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
		await transfer.save();

    } else {
    	await logger.info("---------- DappsStaking - nominationTransfer ERROR --------- ");
    	await logger.info(event.block.block.header.hash.toString());
	}
}

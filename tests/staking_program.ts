import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { StakingProgram } from "../target/types/staking_program";
import { expect } from 'chai';

describe("staking_program", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.StakingProgram as Program<StakingProgram>;

  let stakingAccount: anchor.web3.Keypair;
  let user: anchor.web3.Keypair;

  before(async () => {
    stakingAccount = anchor.web3.Keypair.generate();
    user = anchor.web3.Keypair.generate();

    // Airdrop SOL to user
    const signature = await provider.connection.requestAirdrop(user.publicKey, 1000000000);
    await provider.connection.confirmTransaction(signature);
  });

  it("Initializes staking account", async () => {
    await program.methods.initialize()
      .accounts({
        stakingAccount: stakingAccount.publicKey,
        user: user.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([stakingAccount, user])
      .rpc();

    const account = await program.account.stakingAccount.fetch(stakingAccount.publicKey);
    expect(account.owner.toString()).to.equal(user.publicKey.toString());
    expect(account.stakedAmount.toNumber()).to.equal(0);
    expect(account.rewardAmount.toNumber()).to.equal(0);
  });

  it("Stakes SOL", async () => {
    const stakeAmount = new anchor.BN(100000000); // 0.1 SOL

    await program.methods.stake(stakeAmount)
      .accounts({
        stakingAccount: stakingAccount.publicKey,
        user: user.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([user])
      .rpc();

    const account = await program.account.stakingAccount.fetch(stakingAccount.publicKey);
    expect(account.stakedAmount.toNumber()).to.equal(stakeAmount.toNumber());
  });

  it("Compounds rewards", async () => {
    // Simulate some rewards
    await program.methods.updateRewards(new anchor.BN(10000000))
      .accounts({
        stakingAccount: stakingAccount.publicKey,
      })
      .rpc();

    await program.methods.compound()
      .accounts({
        stakingAccount: stakingAccount.publicKey,
        user: user.publicKey,
      })
      .signers([user])
      .rpc();

    const account = await program.account.stakingAccount.fetch(stakingAccount.publicKey);
    expect(account.stakedAmount.toNumber()).to.equal(110000000); // 0.11 SOL
    expect(account.rewardAmount.toNumber()).to.equal(0);
  });

  it("Claims rewards", async () => {
    // Simulate some rewards
    await program.methods.updateRewards(new anchor.BN(5000000))
      .accounts({
        stakingAccount: stakingAccount.publicKey,
      })
      .rpc();

    const userBalanceBefore = await provider.connection.getBalance(user.publicKey);

    await program.methods.claimReward(false)
      .accounts({
        stakingAccount: stakingAccount.publicKey,
        user: user.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([user])
      .rpc();

    const userBalanceAfter = await provider.connection.getBalance(user.publicKey);
    expect(userBalanceAfter - userBalanceBefore).to.be.closeTo(5000000, 10000); // Allow for small deviation due to transaction fees

    const account = await program.account.stakingAccount.fetch(stakingAccount.publicKey);
    expect(account.rewardAmount.toNumber()).to.equal(0);
  });

  it("Unstakes SOL", async () => {
    const unstakeAmount = new anchor.BN(50000000); // 0.05 SOL

    const userBalanceBefore = await provider.connection.getBalance(user.publicKey);

    await program.methods.unstake(unstakeAmount)
      .accounts({
        stakingAccount: stakingAccount.publicKey,
        user: user.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([user])
      .rpc();

    const userBalanceAfter = await provider.connection.getBalance(user.publicKey);
    expect(userBalanceAfter - userBalanceBefore).to.be.closeTo(50000000, 10000); // Allow for small deviation due to transaction fees

    const account = await program.account.stakingAccount.fetch(stakingAccount.publicKey);
    expect(account.stakedAmount.toNumber()).to.equal(60000000); // 0.06 SOL
  });
});
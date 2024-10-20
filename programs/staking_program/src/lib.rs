use anchor_lang::prelude::*;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod staking_program {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let staking_account = &mut ctx.accounts.staking_account;
        staking_account.owner = *ctx.accounts.user.key;
        staking_account.staked_amount = 0;
        staking_account.reward_amount = 0;
        staking_account.last_stake_timestamp = Clock::get()?.unix_timestamp;
        staking_account.compound_streak = 0;
        Ok(())
    }

    pub fn stake(ctx: Context<Stake>, amount: u64) -> Result<()> {
        let staking_account = &mut ctx.accounts.staking_account;
        let user = &ctx.accounts.user;

        update_rewards(staking_account)?;

        // Transfer SOL from user to program
        **ctx.accounts.user.try_borrow_mut_lamports()? -= amount;
        **ctx.accounts.staking_account.try_borrow_mut_lamports()? += amount;

        staking_account.staked_amount += amount;
        staking_account.last_stake_timestamp = Clock::get()?.unix_timestamp;

        Ok(())
    }

    pub fn unstake(ctx: Context<Unstake>, amount: u64) -> Result<()> {
        let staking_account = &mut ctx.accounts.staking_account;
        let user = &ctx.accounts.user;

        update_rewards(staking_account)?;

        require!(amount <= staking_account.staked_amount, StakingError::InsufficientStakedAmount);

        // Transfer SOL from program to user
        **ctx.accounts.staking_account.try_borrow_mut_lamports()? -= amount;
        **ctx.accounts.user.try_borrow_mut_lamports()? += amount;

        staking_account.staked_amount -= amount;

        Ok(())
    }

    pub fn claim_reward(ctx: Context<ClaimReward>, penalty_applied: bool) -> Result<()> {
        let staking_account = &mut ctx.accounts.staking_account;
        let user = &ctx.accounts.user;

        update_rewards(staking_account)?;

        let reward = if penalty_applied {
            staking_account.reward_amount * 9 / 10 // 10% penalty
        } else {
            staking_account.reward_amount
        };

        // Transfer reward from program to user
        **ctx.accounts.staking_account.try_borrow_mut_lamports()? -= reward;
        **ctx.accounts.user.try_borrow_mut_lamports()? += reward;

        staking_account.reward_amount = 0;
        staking_account.compound_streak = 0;

        Ok(())
    }

    pub fn compound(ctx: Context<Compound>) -> Result<()> {
        let staking_account = &mut ctx.accounts.staking_account;
        
        update_rewards(staking_account)?;

        // Add current rewards to staked amount
        staking_account.staked_amount += staking_account.reward_amount;
        staking_account.reward_amount = 0;
        staking_account.last_stake_timestamp = Clock::get()?.unix_timestamp;
        staking_account.compound_streak += 1;

        Ok(())
    }
}

fn update_rewards(staking_account: &mut Account<StakingAccount>) -> Result<()> {
    let current_time = Clock::get()?.unix_timestamp;
    let time_elapsed = current_time - staking_account.last_stake_timestamp;
    
    // Calculate rewards (e.g., 5% APY)
    let reward_rate = 5;
    let new_rewards = (staking_account.staked_amount as u128 * reward_rate as u128 * time_elapsed as u128) / (100 * 365 * 24 * 60 * 60);
    
    staking_account.reward_amount += new_rewards as u64;
    staking_account.last_stake_timestamp = current_time;

    Ok(())
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init, payer = user, space = 8 + 32 + 8 + 8 + 8 + 8)]
    pub staking_account: Account<'info, StakingAccount>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Stake<'info> {
    #[account(mut, has_one = owner @ StakingError::InvalidOwner)]
    pub staking_account: Account<'info, StakingAccount>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Unstake<'info> {
    #[account(mut, has_one = owner @ StakingError::InvalidOwner)]
    pub staking_account: Account<'info, StakingAccount>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ClaimReward<'info> {
    #[account(mut, has_one = owner @ StakingError::InvalidOwner)]
    pub staking_account: Account<'info, StakingAccount>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Compound<'info> {
    #[account(mut, has_one = owner @ StakingError::InvalidOwner)]
    pub staking_account: Account<'info, StakingAccount>,
    pub user: Signer<'info>,
}

#[account]
pub struct StakingAccount {
    pub owner: Pubkey,
    pub staked_amount: u64,
    pub reward_amount: u64,
    pub last_stake_timestamp: i64,
    pub compound_streak: u64,
}

#[error_code]
pub enum StakingError {
    #[msg("Insufficient staked amount")]
    InsufficientStakedAmount,
    #[msg("Invalid owner")]
    InvalidOwner,
}
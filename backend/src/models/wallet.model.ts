import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ITransaction {
  type: 'credit' | 'debit';
  amount: number;
  source:
    | 'referral'
    | 'challenge'
    | 'spin_win'
    | 'order_refund'
    | 'order_payment'
    | 'spin_cost'
    | 'topup'
    | 'signup_bonus'
    | 'subscription_refund';
  description: string;
  relatedOrderId?: Types.ObjectId;
  expiresAt?: Date;
  balanceAfter: number;
  createdAt: Date;
}

export interface IWallet extends Document {
  userId: Types.ObjectId;
  balance: number;
  promoBalance: number;
  transactions: ITransaction[];
  credit(
    amount: number,
    source: ITransaction['source'],
    description: string,
    options?: {
      relatedOrderId?: Types.ObjectId;
      expiresAt?: Date;
      isPromo?: boolean;
    }
  ): Promise<ITransaction>;
  debit(
    amount: number,
    source: ITransaction['source'],
    description: string,
    options?: {
      relatedOrderId?: Types.ObjectId;
    }
  ): Promise<{ success: boolean; transaction?: ITransaction }>;
  cleanupExpiredPromos(): Promise<number>;
}

const walletSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  balance: {
    type: Number,
    default: 0,
    min: 0,
  },
  promoBalance: {
    type: Number,
    default: 0,
    min: 0,
  },
  transactions: [
    {
      type: {
        type: String,
        enum: ['credit', 'debit'],
        required: true,
      },
      amount: {
        type: Number,
        required: true,
      },
      source: {
        type: String,
        enum: [
          'referral',
          'challenge',
          'spin_win',
          'order_refund',
          'order_payment',
          'spin_cost',
          'topup',
          'signup_bonus',
          'subscription_refund',
        ],
        required: true,
      },
      description: {
        type: String,
        required: true,
      },
      relatedOrderId: {
        type: Schema.Types.ObjectId,
        ref: 'Order',
      },
      expiresAt: {
        type: Date,
      },
      balanceAfter: {
        type: Number,
        required: true,
      },
      createdAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
}, {
  timestamps: true,
});

// Index
walletSchema.index({ 'transactions.createdAt': -1 });

// Credit to wallet
walletSchema.methods.credit = async function (
  amount: number,
  source: ITransaction['source'],
  description: string,
  options?: {
    relatedOrderId?: Types.ObjectId;
    expiresAt?: Date;
    isPromo?: boolean;
  }
): Promise<ITransaction> {
  const transaction: ITransaction = {
    type: 'credit',
    amount,
    source,
    description,
    relatedOrderId: options?.relatedOrderId,
    expiresAt: options?.expiresAt,
    balanceAfter: 0,
    createdAt: new Date(),
  };

  if (options?.isPromo) {
    this.promoBalance += amount;
  } else {
    this.balance += amount;
  }

  transaction.balanceAfter = this.balance + this.promoBalance;
  this.transactions.unshift(transaction);
  await this.save();

  return transaction;
};

// Debit from wallet
walletSchema.methods.debit = async function (
  amount: number,
  source: ITransaction['source'],
  description: string,
  options?: {
    relatedOrderId?: Types.ObjectId;
  }
): Promise<{ success: boolean; transaction?: ITransaction }> {
  const totalBalance = this.balance + this.promoBalance;

  if (totalBalance < amount) {
    return { success: false };
  }

  // Deduct from promo balance first
  let promoDeducted = 0;
  let realDeducted = 0;

  if (this.promoBalance >= amount) {
    promoDeducted = amount;
    this.promoBalance -= amount;
  } else {
    promoDeducted = this.promoBalance;
    realDeducted = amount - this.promoBalance;
    this.promoBalance = 0;
    this.balance -= realDeducted;
  }

  const transaction: ITransaction = {
    type: 'debit',
    amount,
    source,
    description,
    relatedOrderId: options?.relatedOrderId,
    balanceAfter: this.balance + this.promoBalance,
    createdAt: new Date(),
  };

  this.transactions.unshift(transaction);
  await this.save();

  return { success: true, transaction };
};

// Cleanup expired promos
walletSchema.methods.cleanupExpiredPromos = async function (): Promise<number> {
  const now = new Date();
  const expiredTransactions = this.transactions.filter(
    (t: ITransaction) => t.type === 'credit' && t.expiresAt && t.expiresAt < now && t.source === 'signup_bonus'
  );

  let totalExpired = 0;
  for (const tx of expiredTransactions) {
    totalExpired += tx.amount;
    this.promoBalance -= tx.amount;
  }

  if (totalExpired > 0) {
    this.promoBalance = Math.max(0, this.promoBalance);
    await this.save();
  }

  return totalExpired;
};

const Wallet = mongoose.model<IWallet>('Wallet', walletSchema);

export default Wallet;

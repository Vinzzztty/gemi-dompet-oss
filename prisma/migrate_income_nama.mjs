// Migration script to fix null nama values in IncomeTransaction
// Run this file with: node prisma/migrate_income_nama.js

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Starting migration: Fix null nama values in IncomeTransaction...');

  try {
    // Get all income transactions with null nama
    const nullNamaTransactions = await prisma.incomeTransaction.findMany({
      where: { nama: null },
      include: { category: true },
    });

    console.log(`Found ${nullNamaTransactions.length} transactions with null nama`);

    if (nullNamaTransactions.length === 0) {
      console.log('✅ No transactions need updating!');
      return;
    }

    // Update each transaction
    let updated = 0;
    for (const transaction of nullNamaTransactions) {
      const newNama = transaction.category?.name || 'Pemasukan';
      
      await prisma.incomeTransaction.update({
        where: { id: transaction.id },
        data: { nama: newNama },
      });

      updated++;
      console.log(`✅ Updated transaction ${transaction.id}: nama = "${newNama}"`);
    }

    console.log(`\n✨ Migration complete! Updated ${updated} transactions.`);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });

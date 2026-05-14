require('dotenv').config();
const { prisma } = require('../lib/prisma');

async function main() {
  console.log('DATABASE_URL prefix:', process.env.DATABASE_URL?.substring(0, 40));
  try {
    const koperasi = await prisma.koperasi.findFirst();
    console.log('Koperasi:', JSON.stringify(koperasi));

    const count = await prisma.chartOfAccount.count();
    console.log('CoA count:', count);

    // Check what TipeAkunCoa enum values are available
    const { TipeAkunCoa } = require('.prisma/client');
    console.log('TipeAkunCoa enum:', TipeAkunCoa);

    if (koperasi) {
      // Try inserting one standard account
      const test = await prisma.chartOfAccount.create({
        data: {
          koperasiId: koperasi.id,
          kodeAkun: 'TEST.99',
          namaAkun: 'Test Diagnostik Account',
          tipe: 'ASSET',
          isActive: true,
        },
      });
      console.log('Test insert OK:', test.id);

      await prisma.chartOfAccount.delete({ where: { id: test.id } });
      console.log('Cleanup OK');
    } else {
      console.log('No koperasi found — need to create one first');
    }
  } catch (e) {
    console.error('ERROR:', e.message);
    console.error('CODE:', e.code);
    console.error('META:', JSON.stringify(e.meta));
    console.error('STACK:', e.stack?.split('\n').slice(0, 5).join('\n'));
  } finally {
    if (typeof prisma.$disconnect === 'function') {
      await prisma.$disconnect();
    }
  }
}

main();

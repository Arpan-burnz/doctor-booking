const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:arpan@localhost:5432/doctor_booking'
});

async function main() {
  await client.connect();
  try {
    await client.query(`ALTER TABLE "Doctor" ADD COLUMN "isSuspended" BOOLEAN DEFAULT false;`);
    console.log("Column isSuspended added to Doctor table.");
  } catch (err) {
    if (err.code === '42701') { // column already exists
      console.log("Column isSuspended already exists.");
    } else {
      console.error(err);
    }
  }
  await client.end();
}

main();

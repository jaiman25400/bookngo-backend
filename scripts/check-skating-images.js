require("dotenv").config();
const { Client } = require("pg");

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();

  const sql = `
    select
      d.customer_display_name,
      d.customer_city,
      d.customer_slug,
      d.home_image_url
    from "BookNGo_CMS".customer_details d
    join "BookNGo_CMS".customers c
      on c.id = d.customer_id
    join "BookNGo_CMS".activities a
      on a."customerId" = c.id
     and a.activity_type = 'skating'
     and a.is_active = true
    where d.customer_state = 'Ontario'
    order by d.customer_display_name
  `;

  const { rows } = await client.query(sql);
  const missing = rows.filter(
    (row) => !row.home_image_url || !String(row.home_image_url).trim(),
  );

  console.log(`total=${rows.length}`);
  console.log(`with_image=${rows.length - missing.length}`);
  console.log(`missing=${missing.length}`);
  console.log("missing_vendors:");
  for (const row of missing) {
    console.log(`- ${row.customer_display_name} | ${row.customer_city} | ${row.customer_slug}`);
  }

  await client.end();
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});

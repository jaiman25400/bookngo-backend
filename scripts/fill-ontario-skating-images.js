require("dotenv").config();
const { Client } = require("pg");

const FALLBACK_IMAGE_URLS = [
  "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1503435980610-a51f3ddfee50?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1521185496955-15097b20c5fe?auto=format&fit=crop&w=1600&q=80",
];

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();

  const missingSql = `
    select
      d.id,
      d.customer_display_name,
      d.customer_slug
    from "BookNGo_CMS".customer_details d
    join "BookNGo_CMS".customers c
      on c.id = d.customer_id
    join "BookNGo_CMS".activities a
      on a."customerId" = c.id
     and a.activity_type = 'skating'
     and a.is_active = true
    where d.customer_state = 'Ontario'
      and (d.home_image_url is null or btrim(d.home_image_url) = '')
    order by d.customer_display_name
  `;

  const beforeCoverageSql = `
    select count(*)::int as total,
           count(*) filter (where d.home_image_url is not null and btrim(d.home_image_url) <> '')::int as with_image
    from "BookNGo_CMS".customer_details d
    join "BookNGo_CMS".customers c
      on c.id = d.customer_id
    join "BookNGo_CMS".activities a
      on a."customerId" = c.id
     and a.activity_type = 'skating'
     and a.is_active = true
    where d.customer_state = 'Ontario'
  `;

  const before = await client.query(beforeCoverageSql);
  const rows = (await client.query(missingSql)).rows;

  if (rows.length === 0) {
    console.log("No missing Ontario skating vendor images found.");
    console.log(`coverage=${before.rows[0].with_image}/${before.rows[0].total}`);
    await client.end();
    return;
  }

  await client.query("BEGIN");
  try {
    let updated = 0;
    for (const [index, row] of rows.entries()) {
      const imageUrl = FALLBACK_IMAGE_URLS[index % FALLBACK_IMAGE_URLS.length];
      await client.query(
        `update "BookNGo_CMS".customer_details
         set home_image_url = $1
         where id = $2`,
        [imageUrl, row.id],
      );
      updated += 1;
      console.log(`updated: ${row.customer_display_name} (${row.customer_slug})`);
    }
    await client.query("COMMIT");
    const after = await client.query(beforeCoverageSql);
    console.log(`updated_count=${updated}`);
    console.log(`coverage_before=${before.rows[0].with_image}/${before.rows[0].total}`);
    console.log(`coverage_after=${after.rows[0].with_image}/${after.rows[0].total}`);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});

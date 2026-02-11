import { open } from "sqlite";
import sqlite3 from "sqlite3";

import { createSchema } from "./schema";
import { getPendingOrders } from "./queries/order_queries";
import { sendSlackAlert } from "./integrations/slack";

async function main() {
  const db = await open({
    filename: "ecommerce.db",
    driver: sqlite3.Database,
  });

  await createSchema(db, true);

  // Get orders pending longer than 3 days
  const pendingOrders = await getPendingOrders(db);

  console.log("\n=== Orders Pending Longer Than 3 Days ===");
  console.log(`Found ${pendingOrders.length} orders:\n`);

  pendingOrders.forEach((order) => {
    console.log(`Order ID: ${order.order_id}`);
    console.log(`  Customer: ${order.customer_name}`);
    console.log(`  Phone: ${order.phone}`);
    console.log(`  Order Date: ${order.order_date}`);
    console.log(`  Total Amount: $${order.total_amount}`);
    console.log(`  Days Pending: ${Math.floor(order.days_since_created)}`);
    console.log("---");
  });

  // Send Slack alert if there are pending orders
  if (pendingOrders.length > 0) {
    const slackWebhookUrl = process.env.SLACK_WEBHOOK_URL;

    if (!slackWebhookUrl) {
      console.error(
        "\n⚠️  SLACK_WEBHOOK_URL not configured. Skipping Slack notification."
      );
    } else {
      try {
        await sendSlackAlert(slackWebhookUrl, pendingOrders);
        console.log(
          `\n✅ Sent Slack alert for ${pendingOrders.length} pending orders to #order-alerts`
        );
      } catch (error) {
        console.error("\n❌ Failed to send Slack alert:", error);
      }
    }
  } else {
    console.log("\n✅ No orders pending longer than 3 days.");
  }
}

main();

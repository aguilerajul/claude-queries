interface SlackMessage {
  channel: string;
  text: string;
  blocks?: any[];
}

interface PendingOrderAlert {
  order_id: number;
  customer_name: string;
  phone: string;
  order_date: string;
  total_amount: number;
  days_since_created: number;
}

export async function sendSlackAlert(
  webhookUrl: string,
  orders: PendingOrderAlert[]
): Promise<void> {
  if (orders.length === 0) {
    return;
  }

  const message: SlackMessage = {
    channel: "#order-alerts",
    text: `⚠️ ${orders.length} order(s) pending longer than 3 days`,
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: `⚠️ ${orders.length} Order(s) Pending Longer Than 3 Days`,
          emoji: true,
        },
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: "The following orders need immediate follow-up:",
        },
      },
      {
        type: "divider",
      },
    ],
  };

  // Add each order as a block
  orders.forEach((order) => {
    message.blocks!.push({
      type: "section",
      fields: [
        {
          type: "mrkdwn",
          text: `*Order ID:*\n#${order.order_id}`,
        },
        {
          type: "mrkdwn",
          text: `*Days Pending:*\n${Math.floor(order.days_since_created)} days`,
        },
        {
          type: "mrkdwn",
          text: `*Customer:*\n${order.customer_name}`,
        },
        {
          type: "mrkdwn",
          text: `*Phone:*\n${order.phone || "N/A"}`,
        },
        {
          type: "mrkdwn",
          text: `*Order Date:*\n${order.order_date}`,
        },
        {
          type: "mrkdwn",
          text: `*Amount:*\n$${order.total_amount}`,
        },
      ],
    });

    message.blocks!.push({
      type: "divider",
    });
  });

  // Add action footer
  message.blocks!.push({
    type: "context",
    elements: [
      {
        type: "mrkdwn",
        text: "Please follow up with these customers as soon as possible.",
      },
    ],
  });

  // Send to Slack
  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(message),
  });

  if (!response.ok) {
    throw new Error(
      `Failed to send Slack alert: ${response.status} ${response.statusText}`
    );
  }
}

export async function notifyN8n(event, data) {
  try {
    const webhookUrl = process.env.N8N_NOTIFICATION_WEBHOOK_URL;

    if (!webhookUrl) {
      console.error("N8N_NOTIFICATION_WEBHOOK_URL সেট করা নেই");
      return;
    }

    fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event, ...data }),
    }).catch((err) => {
      console.error("n8n notification পাঠাতে সমস্যা হয়েছে:", err);
    });
  } catch (err) {
    console.error("notifyN8n এরর:", err);
  }
}
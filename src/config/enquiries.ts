/** Shown to members as the sender of every team reply. */
export const SUPPORT_AGENT_NAME = "Cloudspital";
export const ENQUIRY_PAGE_SIZE = 50;
export const MAX_CHAT_MESSAGES = 400;
export const MAX_REPLY_LENGTH = 2000;
export const LIST_POLL_MS = 5000;
export const CHAT_POLL_MS = 3000;

export const CANNED_REPLIES = [
  { label: "Greeting", text: "Hi, thanks for reaching out to Cloudspital support. I'm looking into this for you now." },
  { label: "Need a moment", text: "Thanks for waiting. I'm checking the details and will get back to you in a few minutes." },
  { label: "Ask for details", text: "Could you share a little more detail, such as the date and what you see on the screen? That will help me sort this out faster." },
  { label: "We'll call you", text: "Our team will call you on your registered number shortly to help with this." },
  { label: "Update the app", text: "Please update the HealthMatrix app to the latest version from the Play Store or App Store, then try again." },
  { label: "Resolved", text: "Glad we could help. If there's anything else, just send a message here. Take care!" },
] as const;

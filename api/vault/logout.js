import { handleVaultLogout, sendText } from "../_lib/backend.js";

export default function handler(request, response) {
  if (request.method !== "POST") {
    return sendText(response, 405, "Method Not Allowed", {
      Allow: "POST",
    });
  }

  return handleVaultLogout(request, response);
}

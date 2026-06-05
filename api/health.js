import { buildPublicConfig, isVaultConfigured, sendJson } from "./_lib/backend.js";

export default function handler(_request, response) {
  const config = buildPublicConfig();

  return sendJson(response, 200, {
    ok: true,
    date: new Date().toISOString(),
    vaultConfigured: isVaultConfigured(),
    firebaseConfigured: Boolean(
      config.firebaseConfig.apiKey &&
        config.firebaseConfig.authDomain &&
        config.firebaseConfig.projectId &&
        config.firebaseConfig.appId
    ),
  });
}

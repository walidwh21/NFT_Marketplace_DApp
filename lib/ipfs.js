import { create } from "ipfs-http-client";
import { config } from "./config";

let client;

// Created lazily so the app still renders when IPFS is not configured.
function getClient() {
  if (client) return client;
  const { apiHost, projectId, projectSecret } = config.ipfs;
  if (!apiHost) throw new Error("IPFS is not configured (NEXT_PUBLIC_IPFS_API_HOST)");

  const headers = projectId
    ? {
        authorization: `Basic ${Buffer.from(`${projectId}:${projectSecret}`).toString("base64")}`,
      }
    : undefined;

  client = create({ host: apiHost, port: 5001, protocol: "https", headers });
  return client;
}

export const gatewayUrl = (cid) => `${config.ipfs.gateway}/${cid}`;

/** Pin a File/Blob and return its public gateway URL. */
export async function pinFile(file) {
  const { path } = await getClient().add({ content: file });
  return gatewayUrl(path);
}

/** Pin a JSON document and return its public gateway URL. */
export async function pinJSON(value) {
  const { path } = await getClient().add(JSON.stringify(value));
  return gatewayUrl(path);
}

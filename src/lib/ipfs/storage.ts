import { IIpfsProvider } from "./provider.interface";
import { PinataIpfsProvider } from "./pinata.provider";
import { MockIpfsProvider } from "./mock.provider";

let ipfsInstance: IIpfsProvider | null = null;

export function getIpfsProvider(): IIpfsProvider {
  if (ipfsInstance) return ipfsInstance;

  const pinataJwt = process.env.PINATA_JWT;
  const pinataKey = process.env.PINATA_API_KEY;
  const pinataSecret = process.env.PINATA_SECRET_API_KEY;

  if ((pinataJwt && pinataJwt.trim().length > 10) || (pinataKey && pinataSecret)) {
    ipfsInstance = new PinataIpfsProvider(pinataJwt);
  } else {
    ipfsInstance = new MockIpfsProvider();
  }

  return ipfsInstance;
}

import QRCode from "qrcode";

export async function generateQrDataUrl(text: string): Promise<string> {
  try {
    const dataUrl = await QRCode.toDataURL(text, {
      width: 300,
      margin: 2,
      color: {
        dark: "#0F172A",
        light: "#FFFFFF",
      },
      errorCorrectionLevel: "H",
    });
    return dataUrl;
  } catch (err) {
    console.error("Failed to generate QR code data URL:", err);
    return "";
  }
}

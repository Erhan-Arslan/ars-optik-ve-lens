import axios from "axios";
import { dotnetApi } from "@/lib/dotnetApi";
import { getFreshAccessToken } from "@/lib/api";

/**
 * Fetches the proforma invoice PDF from the .NET service and hands it to the browser as a
 * download. A plain link cannot be used: the endpoint needs the bearer token in a header.
 */
export async function downloadInvoice(orderNumber: string): Promise<void> {
  const token = await getFreshAccessToken();
  if (!token) throw new Error("Oturumunuzun süresi doldu. Lütfen tekrar giriş yapın.");

  let blob: Blob;
  try {
    const { data } = await dotnetApi.get<Blob>(`/orders/${encodeURIComponent(orderNumber)}/invoice`, {
      headers: { Authorization: `Bearer ${token}` },
      responseType: "blob",
      // A sleeping free instance can take ~50 s to wake up before it renders the PDF.
      timeout: 70_000,
    });
    blob = data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      throw new Error("Bu siparişin faturası bulunamadı.");
    }
    if (axios.isAxiosError(error) && error.response?.status === 429) {
      throw new Error("Çok fazla indirme denemesi. Lütfen biraz sonra tekrar deneyin.");
    }
    throw new Error("Fatura şu an oluşturulamadı. Lütfen biraz sonra tekrar deneyin.");
  }

  const url = URL.createObjectURL(blob);
  try {
    const link = document.createElement("a");
    link.href = url;
    link.download = `ARS-Optik-${orderNumber}.pdf`;
    document.body.append(link);
    link.click();
    link.remove();
  } finally {
    // Give the browser a moment to start the download before releasing the blob.
    window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
  }
}

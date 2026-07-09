import crypto from "crypto";

const PUBLIC_KEY = process.env.COOLPAY_PUBLIC_KEY || "";
const PRIVATE_KEY = process.env.COOLPAY_PRIVATE_KEY || "";
const BASE_URL = "https://my-coolpay.com/api";

export interface PaylinkParams {
  transaction_amount: number;
  transaction_currency: string;
  transaction_reason: string;
  app_transaction_ref: string;
  customer_phone_number?: string;
  customer_name?: string;
  customer_email?: string;
  customer_lang?: string;
}

export interface PayoutParams {
  transaction_amount: number;
  transaction_currency: string;
  transaction_reason: string;
  app_transaction_ref: string;
  customer_phone_number: string;
  transaction_operator: string; // CM_OM, CM_MOMO, etc.
}

export const coolpayService = {
  /**
   * Génère un lien de paiement (Paylink)
   */
  async generatePaylink(params: PaylinkParams) {
    const url = `${BASE_URL}/${PUBLIC_KEY}/paylink`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify(params),
    });

    const data = await response.json();

    if (!response.ok || data.status === "error") {
      throw new Error(data.message || "Erreur lors de la génération du lien de paiement");
    }

    return data; // Devrait contenir payment_url
  },

  /**
   * Initie un transfert d'argent (Payout)
   */
  async processPayout(params: PayoutParams) {
    // Nécessite d'avoir l'IP du serveur sur la liste blanche My-CoolPay
    const url = `${BASE_URL}/${PUBLIC_KEY}/payout`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({
        ...params,
        private_key: PRIVATE_KEY // Souvent requis dans le body pour l'API Payout
      }),
    });

    const data = await response.json();

    if (!response.ok || data.status === "error") {
      throw new Error(data.message || "Erreur lors de l'initiation du transfert");
    }

    return data;
  },

  /**
   * Vérifie la signature MD5 du Webhook My-CoolPay
   */
  verifySignature(payload: any): boolean {
    const {
      transaction_ref,
      transaction_type,
      transaction_amount,
      transaction_currency,
      transaction_operator,
      signature
    } = payload;

    // Concaténation selon la documentation
    // transaction_ref + transaction_type + transaction_amount + transaction_currency + transaction_operator + private_key
    const stringToSign = `${transaction_ref}${transaction_type}${transaction_amount}${transaction_currency}${transaction_operator}${PRIVATE_KEY}`;
    
    const hash = crypto.createHash('md5').update(stringToSign).digest("hex");
    
    return hash === signature;
  }
};

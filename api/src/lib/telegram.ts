import crypto from 'crypto';

/**
 * Validate Telegram WebApp initData HMAC-SHA256 signature
 * Reference: https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
 */
export function validateTelegramData(initData: string, botToken: string): { valid: boolean; user?: TelegramUser } {
  try {
    const params = new URLSearchParams(initData);
    const hash = params.get('hash');
    if (!hash) return { valid: false };

    // Remove hash from the data string
    params.delete('hash');

    // Sort alphabetically
    const dataCheckString = Array.from(params.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');

    // Create HMAC
    const secretKey = crypto
      .createHmac('sha256', 'WebAppData')
      .update(botToken)
      .digest();

    const computedHash = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');

    if (computedHash !== hash) {
      return { valid: false };
    }

    // Check auth_date is not older than 1 hour
    const authDate = params.get('auth_date');
    if (authDate) {
      const authTimestamp = parseInt(authDate, 10);
      const now = Math.floor(Date.now() / 1000);
      if (now - authTimestamp > 3600) {
        return { valid: false };
      }
    }

    // Extract user
    const userStr = params.get('user');
    if (userStr) {
      const user = JSON.parse(userStr) as TelegramUser;
      return { valid: true, user };
    }

    return { valid: true };
  } catch {
    return { valid: false };
  }
}

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

// utils/facebookCapi.js
import crypto from 'crypto';

/**
 * SHA-256 Hasher for Meta CAPI compliance
 */
const hashData = (data) => {
  if (!data) return undefined;
  const clean = String(data).trim().toLowerCase();
  if (!clean) return undefined;
  return crypto.createHash('sha256').update(clean).digest('hex');
};

/**
 * Clean phone number to E.164 digits only before hashing
 */
const hashPhone = (phone) => {
  if (!phone) return undefined;
  const clean = String(phone).replace(/\D/g, '');
  if (!clean) return undefined;
  return crypto.createHash('sha256').update(clean).digest('hex');
};

/**
 * Send Server-Side Meta Conversions API (CAPI) Event
 * @param {Object} params
 * @param {String} params.eventName - e.g. 'Purchase', 'InitiateCheckout'
 * @param {String} params.pixelId - Facebook Pixel ID
 * @param {String} params.accessToken - Meta Graph API Access Token
 * @param {String} [params.testEventCode] - Optional test event code for Events Manager
 * @param {Object} [params.userData] - { email, phone, name, clientIp, userAgent }
 * @param {Object} [params.customData] - { value, currency, order_id, content_ids, contents, num_items }
 * @param {String} [params.eventId] - Event ID for 1-to-1 browser deduplication
 * @param {String} [params.eventSourceUrl] - Page URL where event occurred
 */
export const sendServerCapiEvent = async ({
  eventName,
  pixelId,
  accessToken,
  testEventCode = '',
  userData = {},
  customData = {},
  eventId = null,
  eventSourceUrl = '',
}) => {
  if (!pixelId || !accessToken) {
    console.warn('[Meta CAPI] Skipped: Missing Pixel ID or Access Token');
    return { success: false, reason: 'Missing configuration' };
  }

  try {
    const currentTimestamp = Math.floor(Date.now() / 1000);

    // Format User Data
    const formattedUserData = {
      client_ip_address: userData.clientIp || undefined,
      client_user_agent: userData.userAgent || undefined,
    };

    if (userData.email) formattedUserData.em = [hashData(userData.email)];
    if (userData.phone) formattedUserData.ph = [hashPhone(userData.phone)];
    
    if (userData.name) {
      const parts = String(userData.name).trim().split(' ');
      formattedUserData.fn = [hashData(parts[0])];
      if (parts.length > 1) {
        formattedUserData.ln = [hashData(parts.slice(1).join(' '))];
      }
    }

    // Format Event Payload
    const payload = {
      data: [
        {
          event_name: eventName,
          event_time: currentTimestamp,
          event_id: eventId || customData.order_id || `srv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          event_source_url: eventSourceUrl || undefined,
          action_source: 'website',
          user_data: formattedUserData,
          custom_data: {
            currency: customData.currency || 'INR',
            value: parseFloat(customData.value) || 0,
            order_id: customData.order_id ? String(customData.order_id) : undefined,
            content_type: 'product',
            content_ids: Array.isArray(customData.content_ids) ? customData.content_ids : undefined,
            contents: Array.isArray(customData.contents) ? customData.contents : undefined,
            num_items: customData.num_items || undefined,
          },
        },
      ],
    };

    if (testEventCode) {
      payload.test_event_code = testEventCode;
    }

    const endpoint = `https://graph.facebook.com/v19.0/${pixelId}/events?access_token=${accessToken}`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (response.ok) {
      console.log(`✅ [Meta CAPI] Server Event Sent (${eventName}):`, result);
      return { success: true, result };
    } else {
      console.error(`❌ [Meta CAPI Error] (${eventName}):`, result);
      return { success: false, error: result };
    }
  } catch (error) {
    console.error(`❌ [Meta CAPI Exception] (${eventName}):`, error);
    return { success: false, error: error.message };
  }
};

import webpush from 'web-push';
import { getDb, isDbConfigured } from '../_db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  const {
    title,
    body,
    targetType = 'all',
    targetPlayerId = null,
    promoAction = 'none',
    promoValue = 0
  } = req.body || {};

  if (!title || !body) {
    return res.status(400).json({ error: 'Naslov i tekst poruke su obavezni.' });
  }

  const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
  const vapidEmail = process.env.VAPID_EMAIL || 'mailto:support@grandslotclub.rs';

  const isVapidConfigured = Boolean(vapidPublicKey && vapidPrivateKey);

  // If DB or VAPID is not set up, simulate push campaign send
  if (!isDbConfigured() || !isVapidConfigured) {
    const simulatedCount = targetType === 'single' ? 1 : (targetType === 'vip' ? 4 : 9);
    return res.status(200).json({
      success: true,
      simulated: true,
      sentCount: simulatedCount,
      failedCount: 0,
      message: `Kampanja uspešno poslata (demo simulacija: ${simulatedCount} uređaja). Za pravo slanje podesite VAPID ključeve i DATABASE_URL.`
    });
  }

  // Configure webpush with VAPID details
  webpush.setVapidDetails(vapidEmail, vapidPublicKey, vapidPrivateKey);

  const sql = getDb();

  try {
    // 1. Query target players with active push subscriptions
    let targetRows;
    if (targetType === 'single' && targetPlayerId) {
      targetRows = await sql`
        SELECT id, push_subscription 
        FROM players 
        WHERE id = ${targetPlayerId} AND is_push_enabled = true AND push_subscription IS NOT NULL;
      `;
    } else if (targetType === 'vip') {
      targetRows = await sql`
        SELECT id, push_subscription 
        FROM players 
        WHERE vip_tier != 'STANDARD' AND is_push_enabled = true AND push_subscription IS NOT NULL;
      `;
    } else if (targetType === 'inactive') {
      targetRows = await sql`
        SELECT id, push_subscription 
        FROM players 
        WHERE last_seen_at < NOW() - INTERVAL '3 days' AND is_push_enabled = true AND push_subscription IS NOT NULL;
      `;
    } else {
      // 'all'
      targetRows = await sql`
        SELECT id, push_subscription 
        FROM players 
        WHERE is_push_enabled = true AND push_subscription IS NOT NULL;
      `;
    }

    if (!targetRows || targetRows.length === 0) {
      return res.status(200).json({
        success: true,
        sentCount: 0,
        failedCount: 0,
        message: 'Nema pretplaćenih uređaja u izabranom segmentu.'
      });
    }

    // 2. Prepare payload with smart promo action
    let targetUrl = 'index.html';
    if (promoAction === 'free_spins') {
      targetUrl = `index.html?promo_action=free_spins&promo_val=${promoValue || 10}`;
    } else if (promoAction === 'credit_bonus') {
      targetUrl = `index.html?promo_action=credit_bonus&promo_val=${promoValue || 500}`;
    }

    const payload = JSON.stringify({
      title: title,
      body: body,
      icon: 'assets/icons/icon-192.png',
      badge: 'assets/icons/favicon.png',
      url: targetUrl,
      data: {
        promoAction,
        promoValue,
        timestamp: Date.now()
      }
    });

    // 3. Dispatch to push endpoints in parallel
    let sentCount = 0;
    let failedCount = 0;
    const expiredPlayerIds = [];

    await Promise.all(
      targetRows.map(async (row) => {
        try {
          const sub = typeof row.push_subscription === 'string' 
            ? JSON.parse(row.push_subscription) 
            : row.push_subscription;

          await webpush.sendNotification(sub, payload);
          sentCount++;
        } catch (err) {
          failedCount++;
          // If subscription expired or unsubscribed (HTTP 410 / 404), mark in DB
          if (err.statusCode === 410 || err.statusCode === 404) {
            expiredPlayerIds.push(row.id);
          }
        }
      })
    );

    // Clean up expired subscriptions
    if (expiredPlayerIds.length > 0) {
      await sql`
        UPDATE players 
        SET is_push_enabled = false, push_subscription = NULL 
        WHERE id = ANY(${expiredPlayerIds});
      `;
    }

    // 4. Record campaign log in DB
    await sql`
      INSERT INTO push_campaigns (
        title, body, target_type, target_player_id, promo_action, promo_value, sent_count, failed_count
      ) VALUES (
        ${title}, ${body}, ${targetType}, ${targetPlayerId}, ${promoAction}, ${Number(promoValue || 0)}, ${sentCount}, ${failedCount}
      );
    `;

    return res.status(200).json({
      success: true,
      sentCount,
      failedCount,
      message: `Uspešno poslato na ${sentCount} uređaja! (${failedCount} neuspešnih)`
    });
  } catch (error) {
    console.error('Push dispatch error:', error);
    return res.status(500).json({
      success: false,
      error: 'Greška pri slanju push kampanje: ' + error.message
    });
  }
}

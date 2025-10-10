# Cron Job Email Reminder System

Since GitHub Actions requires additional token permissions, here's a simpler approach using cron jobs.

## Option 1: Server Cron Job (Recommended)

If you have access to your server, set up a cron job:

```bash
# Edit crontab
crontab -e

# Add this line to run every 5 minutes
*/5 * * * * /usr/bin/node /path/to/your/project/scripts/send-reminders.js
```

## Option 2: External Cron Service

Use a free external service like:
- **Cron-job.org** - Free cron service
- **EasyCron** - Reliable cron service
- **Cronitor** - Monitoring included

### Setup with Cron-job.org:

1. Go to https://cron-job.org
2. Create account and verify email
3. Add new cron job:
   - **URL**: `https://terminiyt.com/api/send-reminders`
   - **Method**: POST
   - **Schedule**: Every 5 minutes
   - **Title**: Booking Reminders
   - **Timezone**: **IMPORTANT - Set to UTC+2 (Europe/Tirana)**

**⚠️ CRITICAL TIMEZONE SETTING:**
- Cron-job.org runs in UTC by default
- Your application expects UTC+2 (Albania/Kosovo time)
- Set the cron job timezone to **UTC+2** or **Europe/Tirana**
- This ensures the cron runs at the correct local time

## Option 3: Manual Testing

Test the reminder system manually:

```bash
# Test the API endpoint
curl -X POST https://terminiyt.com/api/send-reminders

# Or use the script
node scripts/send-reminders.js
```

## Current System Status

✅ **API Endpoint**: `/api/send-reminders` is working
✅ **Email Templates**: Booking reminder template ready
✅ **Script**: `scripts/send-reminders.js` available
✅ **Database**: Queries bookings correctly
✅ **SMTP**: Email sending configured

## Next Steps

1. Choose your preferred cron method
2. Set up the schedule (every 5 minutes recommended)
3. Test with a booking 30 minutes in the future
4. Monitor logs for successful email delivery

The reminder system is ready - you just need to schedule it to run automatically!

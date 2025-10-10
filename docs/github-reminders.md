# GitHub Actions Email Reminder System

This system uses GitHub Actions to automatically send booking reminder emails every 5 minutes.

## How It Works

1. **GitHub Actions Workflow** (`.github/workflows/send-reminders.yml`)
   - Runs every 5 minutes via cron schedule
   - Makes a POST request to your API endpoint
   - Can be triggered manually from GitHub Actions tab

2. **API Endpoint** (`/api/send-reminders`)
   - Finds bookings that start in 30 minutes
   - Sends reminder emails to customers
   - Returns success/failure status

## Setup Instructions

### 1. GitHub Repository Settings

1. Go to your GitHub repository settings
2. Navigate to "Secrets and variables" → "Actions"
3. Add the following repository secret:
   - `API_URL`: Your production API URL (e.g., `https://terminiyt.com`)

### 2. GitHub Personal Access Token (for manual triggering)

If you want to manually trigger reminders using the script:

1. Go to GitHub Settings → Developer settings → Personal access tokens
2. Generate a new token with `repo` scope
3. Set it as environment variable:
   ```bash
   export GITHUB_TOKEN=your_token_here
   ```

### 3. Manual Triggering

```bash
# Trigger the workflow manually
node scripts/trigger-reminders.js
```

## Workflow Schedule

- **Frequency**: Every 5 minutes
- **Cron Expression**: `*/5 * * * *`
- **Timezone**: UTC

## Monitoring

1. Go to your GitHub repository
2. Click on "Actions" tab
3. Select "Send Booking Reminders" workflow
4. View logs and execution history

## Troubleshooting

### Workflow Not Running
- Check if GitHub Actions are enabled for your repository
- Verify the cron schedule is correct
- Check repository secrets are set properly

### API Errors
- Verify your API URL is correct and accessible
- Check API endpoint logs for errors
- Ensure SMTP configuration is working

### Email Not Sending
- Check SMTP credentials in environment variables
- Verify email templates are correct
- Check API logs for email sending errors

## Customization

### Change Schedule
Edit the cron expression in `.github/workflows/send-reminders.yml`:
```yaml
schedule:
  - cron: '*/10 * * * *'  # Every 10 minutes
  - cron: '0 */1 * * *'   # Every hour
```

### Add Notifications
Add Slack/Discord notifications to the workflow:
```yaml
- name: Notify on Failure
  if: failure()
  uses: 8398a7/action-slack@v3
  with:
    status: failure
    webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

## Benefits

✅ **Reliable**: GitHub Actions has 99.9% uptime
✅ **Free**: No cost for public repositories
✅ **Scalable**: Handles high volume automatically
✅ **Monitored**: Built-in logging and error tracking
✅ **Flexible**: Easy to modify schedule and logic

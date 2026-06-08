# DraftMate Sideloading Instructions

## Current Status
- ✅ HTTPS server running on https://localhost:3000
- ✅ Certificate installed and trusted
- ✅ Manifest registered in registry
- ❌ Word showing "ADD-IN ERROR" when trying to load

## Alternative Method: Manual Upload

Since the automatic sideloading isn't working, try this manual method:

### Step 1: Start the Server
```cmd
cd E:\files-mentioned-by-the-user-draftmate
npm start
```
Keep this running!

### Step 2: Open Word Normally
- Open Microsoft Word (not through the sideload command)
- Create a new blank document

### Step 3: Upload the Manifest Manually
1. Go to **Insert** tab → **Get Add-ins** (or **Add-ins** button)
2. Click **Upload My Add-in** (bottom right corner)
3. Browse to: `E:\AddInManifests\manifest.xml`
4. Click **Upload**

### Step 4: Look for DraftMate Button
- Check the **Home** tab ribbon for a "DraftMate" button
- Click it to open the task pane

## If Manual Upload Doesn't Show

Try this registry-based approach:

### Method 2: Direct Registry Entry

1. Close all Word instances
2. Run this command in PowerShell as Administrator:
```powershell
New-ItemProperty -Path "HKCU:\Software\Microsoft\Office\16.0\WEF\Developer" -Name "E:\AddInManifests\manifest.xml" -Value "" -PropertyType String -Force
```

3. Open Word
4. Go to **File** → **Options** → **Add-ins**
5. At the bottom, select **Manage: COM Add-ins** → **Go**
6. Look for DraftMate in the list

## Testing the Server Directly

To verify the server works, open these URLs in your browser:
- https://localhost:3000 (should show login page)
- https://localhost:3000/taskpane/taskpane.html (should show the taskpane)
- https://localhost:3000/test-office.html (should show test page)

## Common Issues

### Issue: Certificate Not Trusted
**Solution:** Run this command:
```cmd
npx office-addin-dev-certs install --machine
```

### Issue: Port 3000 Already in Use
**Solution:** Change the port in server/index.js or set PORT environment variable:
```cmd
set PORT=3001
npm start
```
Then update all URLs in manifest.xml to use port 3001.

### Issue: Office Using Old IE Engine
**Solution:** Already applied - we set UseEdgeWebView registry key.

## Nuclear Option: Use Office Online

If desktop Word continues to fail, you can test with Office Online:

1. Go to https://www.office.com
2. Sign in with your Microsoft account
3. Open Word Online
4. Use the same **Insert → Get Add-ins → Upload My Add-in** process

Note: You'll need to deploy to a public HTTPS URL for Office Online to work (localhost won't work).

## Next Steps for Production

Once you get it working locally, for production deployment:

1. Deploy your app to a hosting service (Vercel, Netlify, Azure, etc.)
2. Update manifest.xml with your production URLs
3. Submit to AppSource or distribute the manifest to users
4. Users install via **Insert → Get Add-ins → Upload My Add-in**

## Support

If none of these work, the issue might be:
- Office version compatibility (you have Office 2016 version 16.0.10417)
- Corporate/IT policies blocking add-ins
- Windows security settings blocking localhost connections

Try updating Office to the latest version if possible.

# 🚀 Spaceship DNS Setup Guide

Follow these steps to point your domain `zerosbykai.com` to your live Vercel deployment.

## Step 1: Login to Spaceship
1.  Go to [spaceship.com](https://www.spaceship.com) and log in.
2.  Navigate to your **Launchpad** or **Domain List**.
3.  Click on the **Manage** button next to `zerosbykai.com`.

## Step 2: Advanced DNS
1.  In the domain management menu, look for **DNS** or **Advanced DNS**.
2.  Ensure your **Nameserver Type** is set to "Spaceship DNS" (or Basic DNS).

## Step 3: Add Records
You need to add two records to point your domain to Vercel.

### Record 1 (Root Domain)
- **Type**: `A Record`
- **Host**: `@`
- **Value**: `76.76.21.21`
- **TTL**: `Automatic` (or 30 min)

### Record 2 (WWW Subdomain)
- **Type**: `CNAME Record`
- **Host**: `www`
- **Value**: `cname.vercel-dns.com`
- **TTL**: `Automatic` (or 30 min)

---

## Step 4: Verify in Vercel
1.  Go to your **Vercel Dashboard** > **ZerosByKai Project**.
2.  Click **Settings** > **Domains**.
3.  Add `zerosbykai.com` (if you haven't already).
4.  Vercel will check the DNS records. It might take up to 24 hours to propagate, but usually it's instant with Spaceship.

## Troubleshooting
- If you see existing A/CNAME records for `@` or `www`, **delete them** before adding the new ones.
- If Vercel says "Invalid Configuration", wait 5-10 minutes and click "Refresh".

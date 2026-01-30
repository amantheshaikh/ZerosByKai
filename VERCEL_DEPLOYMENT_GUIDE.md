# 🚀 Vercel Deployment Guide

This guide explains how to deploy the ZerosByKai frontend to Vercel using the GitHub repository we just created.

## ✅ Pre-requisites
- **GitHub Repo**: [amantheshaikh/ZerosByKai](https://github.com/amantheshaikh/ZerosByKai)
- **Vercel Account**: [vercel.com](https://vercel.com)

---

## Step 1: Import Project

1.  Go to your [Vercel Dashboard](https://vercel.com/dashboard).
2.  Click **"Add New..."** > **"Project"**.
3.  Find `ZerosByKai` in the list of repositories and click **"Import"**.

---

## Step 2: Configure Project

Vercel will detect Next.js automatically, but we need to point it to the correct folder.

1.  **Framework Preset**: `Next.js` (Default)
2.  **Root Directory**: 
    - Click **"Edit"** next to Root Directory.
    - Select `frontend`.
    - Click **"Continue"**.

---

## Step 3: Environment Variables

Expand the **"Environment Variables"** section and add the following:

| Key | Value |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | `https://zerosbykai-api-prod.fly.dev` |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://pideczjhbmhjktqlerhz.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | *(Your Supabase Anon Key - see below)* |

> **Note**: You can copy these values from `frontend/.env.production` in your local project.

---

## Step 4: Deploy

1.  Click **"Deploy"**.
2.  Wait for the build to complete (approx 1-2 minutes).
3.  Once finished, you will see a preview of your live site!

---

## 🌐 Custom Domain (Optional)

To use `zerosbykai.com`:

1.  Go to your Project Dashboard on Vercel.
2.  Click **"Settings"** > **"Domains"**.
3.  Enter `zerosbykai.com` and click **"Add"**.
4.  Follow the instructions to update your DNS records (usually adding an A record or CNAME).

---

## 🔄 Redeploying Updates

Since your Vercel project is connected to GitHub:
- Any push to the `main` branch will **automatically trigger a new deployment**.
- You just need to commit your changes and run `git push`.

# Parenting Bot — Deploy Guide

## Deploy to Vercel (free, ~5 min)

### Step 1 — Get a free Gemini API key
1. Go to https://aistudio.google.com/app/apikey
2. Click **Create API key**
3. Copy the key (looks like `AIzaSy...`)

### Step 2 — Upload to Vercel
1. Go to https://vercel.com and sign up (free)
2. Click **Add New → Project**
3. Choose **"Upload folder"** and select this `parenting-bot` folder
4. Click **Deploy** — wait ~1 min

### Step 3 — Add your API key
1. In your Vercel project, go to **Settings → Environment Variables**
2. Add:
   - Name: `GEMINI_API_KEY`
   - Value: your key from Step 1
3. Click **Save**
4. Go to **Deployments** → click **Redeploy**

### Done!
Your app is live at `your-project.vercel.app` 🎉

---

## Run locally (optional)
```bash
npm install
npm run dev
# open http://localhost:3000
```

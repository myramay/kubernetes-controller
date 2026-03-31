# 🚪 Entry Point
Personalized onboarding and digital safety for immigrants
Vanderbilt Global Good Hackathon 2026

---

## What this app does
1. Onboarding — 5 questions → AI generates personalized checklist + resources + NGOs
2. Job & SMS Scanner — paste suspicious message → AI detects if it's a scam
3. Data Breach Checker — enter email → see if data was leaked and what to do

---

## Team ownership

| Person | Branch | Files |
|--------|--------|-------|
| Person 1 | feature/frontend | App.jsx, Home, Onboarding, Dashboard, Navbar, LanguageSelector, OnboardingForm |
| Person 2 | feature/scam-checklist | Checklist, ResourceList, ScamChecker, ScamResult, routes/checklist.py, routes/resources.py, routes/scam.py, utils/link_validator.py |
| Person 3 | feature/breach | BreachChecker, BreachResult, routes/breach.py |
| Person 4 | feature/backend-ngo | main.py, routes/ngos.py, data/ngos.json, NGOList.jsx, deploy |

---

## Run the frontend
```
cd frontend
npm install
npm start
Runs at http://localhost:3000
```

---

## Run the backend
```
cd backend
pip install -r requirements.txt
copy .env.example .env        (Windows)
cp .env.example .env          (Mac)
Add your API keys to .env
uvicorn main:app --reload
Runs at http://localhost:8000
```

---

## API Keys needed

Claude API (for checklist, resources, NGOs, scam, breach)
1. Go to console.anthropic.com
2. Create account → API Keys → Create Key
3. Paste into backend/.env as ANTHROPIC_API_KEY

HIBP API (for breach checker)
1. Go to haveibeenpwned.com/API/v3
2. Get free key
3. Paste into backend/.env as HIBP_API_KEY

---

## How Claude is used

| Feature | What Claude does |
|---------|-----------------|
| Checklist | Generates 6-8 personalized steps with verified links |
| Resources | Suggests 4-5 relevant free resources with verified links |
| NGOs | Filters real NGOs from ngos.json and explains why each fits |
| Scam detector | Analyzes message for immigrant-targeting fraud patterns |
| Breach explainer | Explains breach data in plain language + action steps |

## Link validation
Every link Claude generates is automatically checked.
If a link is broken → backend asks Claude to try again.
Maximum 3 retries. Only verified links reach the frontend.

---

## Git rules
- Never push directly to main
- Never commit .env files
- Never touch someone else's files without asking
- Push to your branch → open Pull Request → merge into dev

## Git workflow
```
One time setup:
git checkout -b feature/your-name

Every hour:
git add .
git commit -m "what you did"
git push origin feature/your-name

When done:
Open Pull Request on GitHub → merge into dev
```

---

## Full project structure
```
entrypoint/
├── frontend/
│   ├── src/
│   │   ├── App.jsx                     Person 1
│   │   ├── pages/
│   │   │   ├── Home.jsx                Person 1
│   │   │   ├── Onboarding.jsx          Person 1
│   │   │   ├── Dashboard.jsx           Person 1
│   │   │   └── Safety.jsx              Person 2 + 3
│   │   └── components/
│   │       ├── Navbar.jsx              Person 1
│   │       ├── LanguageSelector.jsx    Person 1
│   │       ├── OnboardingForm.jsx      Person 1
│   │       ├── Checklist.jsx           Person 2
│   │       ├── ResourceList.jsx        Person 2
│   │       ├── NGOList.jsx             Person 4
│   │       ├── ScamChecker.jsx         Person 2
│   │       ├── ScamResult.jsx          Person 2
│   │       ├── BreachChecker.jsx       Person 3
│   │       └── BreachResult.jsx        Person 3
│   └── package.json
├── backend/
│   ├── main.py                         Person 4
│   ├── routes/
│   │   ├── checklist.py                Person 2
│   │   ├── resources.py                Person 2
│   │   ├── ngos.py                     Person 4
│   │   ├── scam.py                     Person 2
│   │   └── breach.py                   Person 3
│   ├── utils/
│   │   └── link_validator.py           Person 2
│   ├── data/
│   │   └── ngos.json                   Person 4
│   ├── requirements.txt
│   └── .env.example
├── .gitignore
└── README.md
```

---

## Deploy
| Part | Where | How |
|------|-------|-----|
| Frontend | Vercel | Import GitHub repo → select frontend folder → deploy |
| Backend | Railway | Import GitHub repo → select backend folder → add env vars → deploy |

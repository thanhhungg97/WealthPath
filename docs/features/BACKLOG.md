# WealthPath Feature Backlog

## Priority Legend
- 🔴 **P0** - Critical / Must Have
- 🟠 **P1** - High Priority
- 🟡 **P2** - Medium Priority
- 🟢 **P3** - Nice to Have

---

## Top 5 High Priority Features

### 1. 🔴 Recurring Transactions (P0)
**Status**: Not Started  
**Effort**: Medium (3-5 days)

Automatically add recurring income/expenses (salary, rent, subscriptions).

**Why Important**:
- Most users have 70%+ recurring transactions
- Saves massive time on data entry
- Improves budget accuracy

**Features**:
- [ ] Create recurring transaction templates
- [ ] Frequency: daily, weekly, monthly, yearly
- [ ] Auto-generate on schedule (cron job)
- [ ] Edit/pause/delete recurring items
- [ ] Dashboard widget showing upcoming bills

**Files to modify**:
- `backend/internal/model/models.go` - Add RecurringTransaction model
- `backend/internal/service/recurring_service.go` - New service
- `frontend/src/app/(dashboard)/recurring/page.tsx` - New page

---

### 2. 🔴 Reports & Analytics (P0)
**Status**: Not Started  
**Effort**: Medium (3-5 days)

Visual spending analysis with charts and insights.

**Why Important**:
- Users need to understand spending patterns
- Key differentiator from basic trackers
- Helps identify saving opportunities

**Features**:
- [ ] Spending by category (pie chart)
- [ ] Income vs Expenses over time (line chart)
- [ ] Monthly comparison (bar chart)
- [ ] Top spending categories
- [ ] Year-over-year trends
- [ ] Export to PDF

**Tech**:
- Use Recharts or Chart.js for frontend
- Backend aggregation endpoints

---

### 3. 🟠 Notifications & Alerts (P1)
**Status**: Not Started  
**Effort**: Medium (3-5 days)

Push/email notifications for important events.

**Why Important**:
- Proactive budget management
- Bill payment reminders prevent late fees
- Goal progress motivation

**Features**:
- [ ] Budget threshold alerts (80%, 100%)
- [ ] Bill due date reminders
- [ ] Savings goal milestones
- [ ] Unusual spending detection
- [ ] Weekly summary email

**Tech**:
- Email: SendGrid, Resend, or AWS SES
- Push: Web Push API or Firebase

---

### 4. 🟠 Data Import/Export (P1)
**Status**: Not Started  
**Effort**: Small (2-3 days)

Import from bank CSV, export for taxes.

**Why Important**:
- Onboarding - import existing data
- Tax season - export for accountant
- Data portability (user trust)

**Features**:
- [ ] CSV import (bank statement format)
- [ ] CSV export (transactions, budgets)
- [ ] PDF report generation
- [ ] Date range selection
- [ ] Category mapping for imports

---

### 5. 🟠 Mobile Responsive / PWA (P1)
**Status**: Partial  
**Effort**: Medium (3-5 days)

Fully mobile-friendly with offline support.

**Why Important**:
- 60%+ users access on mobile
- Quick expense entry on-the-go
- Compete with mobile-first apps

**Features**:
- [ ] Responsive design audit
- [ ] Mobile navigation (hamburger menu)
- [ ] PWA manifest & service worker
- [ ] Offline transaction entry
- [ ] Install prompt
- [ ] Quick-add floating button

---

## Future Features (P2-P3)

| Feature | Priority | Effort | Description |
|---------|----------|--------|-------------|
| Bank Connection (Plaid) | 🟡 P2 | Large | Auto-import from banks |
| Multi-currency | 🟡 P2 | Medium | Support multiple currencies |
| Investment Tracking | 🟡 P2 | Large | Stock/crypto portfolio |
| Shared Budgets | 🟢 P3 | Medium | Family/couple accounts |
| Receipt Scanning | 🟢 P3 | Medium | OCR for receipts |
| Dark Mode | 🟢 P3 | Small | Theme toggle |
| 2FA Authentication | 🟡 P2 | Small | Extra security |
| API Integrations | 🟢 P3 | Medium | Zapier, IFTTT |

---

## How to Pick Next Feature

1. **User Impact**: How many users benefit?
2. **Business Value**: Retention, engagement, conversion?
3. **Effort**: Can we ship in 1-2 weeks?
4. **Dependencies**: What's blocking this?

---

## Implementation Template

When starting a feature, create a file in `docs/features/`:

```markdown
# Feature: [Name]

## Overview
Brief description

## User Stories
- As a user, I want to...

## Technical Design
- Backend changes
- Frontend changes
- Database migrations

## Tasks
- [ ] Task 1
- [ ] Task 2

## Testing
- [ ] Unit tests
- [ ] Integration tests
- [ ] Manual QA
```



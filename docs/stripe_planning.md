**User**

Trial duration: 30 days from signup regardless of plan? YES

Trial features: During trial have features BASED on ther Selected Plan's Feature limits. So the features don't cvhange whe the billing starts.

Trial end behavior: When trial expires, what happens?
Auto-convert to free tier? YES
Require payment info before trial starts? YES. -they ahve to SUBSCRIBE to PAID Plan before Trial Starts. (Free Plan has no trial).
Send multiple reminders during trial? YES ABOUT Trial Ending...but we will need a place in Admin Settings to enter SMTP Settings for outbound mail server I assume?

Payment collection timing: When do you want to collect payment info?
At signup (but don't charge until trial ends)? YES

3. STRIPE PRODUCT STRUCTURE - Do YOU have access to my Stripe account to create these tiers there?

Product naming: Should these match exactly? YES

Pricing & Billing cycles:
Please see oour /pricing page for subscriotion charge amounts, AND Annaukl discounts @pricing.js 

4. USER EXPERIENCE FLOW
Allow users to Login to our Web app, but IF it's their VERY FIRST TIME Logging In (they are not allowed to search before choosing ONE Plan), TAKE THEM to Pricing Page with a Message "Please choose a plan to proceed, Free plan does not require credit card, Paid plans come with 30-day trial".

(a) IF USER SELECTS FREE ACCOUNT, this does NOT need any Stripe Integration BUT we still want to mark the same fields in supabase around their subscription details as IF they had gone through Stripe (all the details that make sense). Once we have marked them as a Free Account in supabase take them to the Search Page

(b)IF USER Selectes PAID Plan- this is when STRIPE Integration comes into play, and this does requite credit card, but comes with free 30-day trial. Make sure they enter a valid Credit Card, and Email address...BEFORE sending to Stripe, we want to search supabase for their Email Address related to any existing Paid Plans  - so they DO NOT signup twice for same thing with same email. IF theyab re UPGRADING that is different but we have not gotten there yet.

 - IF EMAIL Found under WITH paid plan alert user they ALREADY have an account and show their current Account Tier and recurring payment amount.

Please confirm, no coding yet


---

**Cursor**

Perfect! This is a very well-thought-out trial flow. Let me confirm my understanding and ask a few clarifying questions:

## **✅ CONFIRMED REQUIREMENTS**

### **Trial Structure**
- **30-day trial** for ALL paid plans (Free plan = no trial)
- **Trial features** = Full features of their selected plan
- **Trial end** = Auto-convert to free tier
- **Payment collection** = At signup (credit card required before trial starts)

### **User Flow**
1. **First-time login** → Redirect to pricing page with plan selection message
2. **Free plan** → No Stripe, mark in Supabase, go to search page
3. **Paid plan** → Stripe integration, credit card validation, 30-day trial

### **Duplicate Prevention**
- **Check Supabase** for existing paid plans with same email
- **Alert user** if they already have a paid account
- **Show current tier** and recurring payment amount

## **❓ CLARIFYING QUESTIONS**

### **1. Stripe Account Access**
> "Do YOU have access to my Stripe account to create these tiers there?"

**No, I don't have access to your Stripe account.** You'll need to:
- Create the products in your Stripe dashboard
- Set up the pricing tiers (Free: $0, Roadie: $10/$8, Hero: $18/$16)
- Configure the annual discounts
- Share the Stripe product IDs with me for integration

### **2. Email Validation Flow**
When checking for existing paid plans:
- **Should we check Supabase first** (before Stripe) to prevent unnecessary Stripe calls?
- **What if email exists but is on free tier?** Allow upgrade to paid?
- **What if email exists on different paid tier?** Allow plan change?

### **3. Admin SMTP Settings**
For trial expiration emails:
- **Should this be in your existing admin settings table?** (I see you have `admin_settings`)
- **What email templates** do you want? (trial ending soon, trial expired, etc.)
- **How many reminders?** (7 days before, 1 day before, day of expiration?)

### **4. Plan Selection UI**
- **Should plan selection happen in a modal** after login, or redirect to full pricing page?
- **What if user tries to access search page** without selecting a plan? Redirect back to pricing?
- **Can users change plans** during trial, or locked in until trial ends?

### **5. Database Fields**
Looking at your schema, I see:
- `subscription_tier` (free, roadie, hero)
- `trial_ends_at`
- `subscription_status` (active, canceled, past_due, trialing)

**Questions:**
- **Should we add `trial_started_at`** to track when trial began?
- **Should we track `plan_selected_at`** for when they chose their plan?
- **Do you want `trial_reminder_sent`** fields to track email notifications?

## **�� MY RECOMMENDED IMPLEMENTATION PLAN**

### **Phase 1: Core Trial Flow**
1. **Plan Selection Modal** after first login
2. **Stripe Product Creation** (you do this in Stripe dashboard)
3. **Basic Trial Management** (start/end dates, auto-conversion)

### **Phase 2: Email System**
1. **Admin SMTP Settings** in your existing admin panel
2. **Trial Reminder Emails** (7 days, 1 day, expired)
3. **Email Templates** for different trial stages

### **Phase 3: Advanced Features**
1. **Plan Change During Trial** (if you want this)
2. **Trial Analytics** (conversion rates, usage patterns)
3. **Admin Trial Management** (extend trials, view status)

## **❓ FINAL QUESTIONS**

1. **Do you want me to help you set up the Stripe products** (I can give you the exact steps)?
2. **Should trial users see any "trial" indicators** in the UI?
3. **What happens if credit card fails** during trial? Immediate conversion to free?

This flow looks really solid! Once you confirm these details, I can create a comprehensive implementation plan.

---

**User**

1. YES!!
2. YES!!
3. YES!! Plus email notification to please Try Again to signup for {Plan Name}

---

**Cursor**

Excellent! Now I have a complete picture. Let me create a comprehensive implementation plan for your Stripe trial integration:

## **🚀 COMPREHENSIVE IMPLEMENTATION PLAN**

### **Phase 1: Stripe Product Setup (You Do This)**

#### **Step 1: Create Products in Stripe Dashboard**
1. **Free Plan** (Product ID: `prod_free`)
   - Price: $0/month
   - Billing: Monthly only
   - No trial period

2. **Roadie Plan** (Product ID: `prod_roadie`)
   - Monthly Price: $10/month
   - Annual Price: $8/month (billed annually)
   - Trial: 30 days
   - Billing: Monthly or Annual

3. **Hero Plan** (Product ID: `prod_hero`)
   - Monthly Price: $18/month
   - Annual Price: $16/month (billed annually)
   - Trial: 30 days
   - Billing: Monthly or Annual

#### **Step 2: Configure Webhook Endpoints**
- **Trial ending soon** (7 days before)
- **Trial expired** (day of expiration)
- **Payment failed** (credit card issues)
- **Subscription status changes**

### **Phase 2: Database Schema Updates**

#### **New Fields to Add:**
```sql
-- Add to user_profiles table
ALTER TABLE user_profiles ADD COLUMN plan_selected_at TIMESTAMPTZ;
ALTER TABLE user_profiles ADD COLUMN trial_started_at TIMESTAMPTZ;
ALTER TABLE user_profiles ADD COLUMN trial_reminder_sent JSONB DEFAULT '[]';

-- Add to subscriptions table  
ALTER TABLE subscriptions ADD COLUMN trial_started_at TIMESTAMPTZ;
ALTER TABLE subscriptions ADD COLUMN trial_reminder_sent JSONB DEFAULT '[]';
```

### **Phase 3: Admin Settings for Email System**

#### **New Admin Settings:**
```json
{
  "smtp_settings": {
    "host": "smtp.gmail.com",
    "port": 587,
    "username": "noreply@guitartube.net",
    "password": "encrypted_password",
    "encryption": "tls"
  },
  "trial_emails": {
    "trial_ending_soon": {
      "subject": "Your {plan_name} trial ends in 7 days",
      "template": "trial_ending_soon.html"
    },
    "trial_expired": {
      "subject": "Your {plan_name} trial has expired",
      "template": "trial_expired.html"
    },
    "payment_failed": {
      "subject": "Payment failed - Please update your card",
      "template": "payment_failed.html"
    }
  }
}
```

### **Phase 4: User Flow Implementation**

#### **4.1 First-Time Login Flow**
```
User logs in → Check if plan_selected_at exists
├─ NO: Redirect to pricing page with message
│   "Please choose a plan to proceed. Free plan requires no credit card. 
│    Paid plans come with 30-day trial."
└─ YES: Proceed to search page
```

#### **4.2 Plan Selection Flow**
```
User selects plan:
├─ FREE PLAN:
│   ├─ Mark in Supabase: subscription_tier = 'free', plan_selected_at = NOW()
│   ├─ No Stripe integration needed
│   └─ Redirect to search page
└─ PAID PLAN:
    ├─ Show credit card form
    ├─ Validate email (check Supabase for existing paid plans)
    ├─ If email exists with paid plan: Show current account details
    ├─ If email new or free tier: Proceed to Stripe
    ├─ Create Stripe customer + subscription with trial
    ├─ Mark in Supabase: subscription_tier, trial_started_at, plan_selected_at
    └─ Redirect to search page
```

#### **4.3 Trial Management Flow**
```
Daily Cron Job:
├─ Check users with trial_ends_at approaching (7 days)
│   ├─ Send "trial ending soon" email
│   └─ Mark reminder_sent in database
├─ Check users with expired trials
│   ├─ Convert to free tier
│   ├─ Send "trial expired" email
│   └─ Update subscription status
└─ Check failed payments
    ├─ Send "payment failed" email
    └─ Convert to free tier after grace period
```

### **Phase 5: Email Templates**

#### **5.1 Trial Ending Soon (7 days)**
```
Subject: Your {plan_name} trial ends in 7 days

Hi {user_name},

Your {plan_name} trial will expire on {trial_end_date}. 
To continue enjoying premium features, please update your payment method.

Current plan: {plan_name}
Trial ends: {trial_end_date}
Monthly cost: ${monthly_price}

[UPDATE PAYMENT METHOD] [VIEW PLAN DETAILS]

Questions? Contact support@guitartube.net
```

#### **5.2 Trial Expired**
```
Subject: Your {plan_name} trial has expired

Hi {user_name},

Your {plan_name} trial has expired. You've been converted to our free plan.

To restore premium features, please update your payment method:

[UPGRADE TO {plan_name}] [VIEW ALL PLANS]

Free plan features:
- Basic video flipping
- Limited daily searches
- Limited watch time
```

#### **5.3 Payment Failed**
```
Subject: Payment failed - Please update your card

Hi {user_name},

We couldn't process your payment for your {plan_name} subscription. 
Your account has been converted to our free plan.

To restore premium features, please update your payment method:

[UPDATE PAYMENT METHOD] [CONTACT SUPPORT]

If you need help, contact support@guitartube.net
```

### **Phase 6: UI Updates**

#### **6.1 Plan Selection Modal**
- **Appears after first login** (if no plan selected)
- **Shows all three plans** with features and pricing
- **Free plan button**: "Get Started Free" (no credit card)
- **Paid plan buttons**: "Start {Plan} Trial" (credit card required)

#### **6.2 Trial Indicators**
- **Header badge**: "TRIAL - {X} days left"
- **Settings page**: Trial countdown and upgrade options
- **Feature restrictions**: Show what happens after trial

#### **6.3 Payment Form**
- **Credit card fields** (Stripe Elements)
- **Email validation** (check for existing paid accounts)
- **Plan confirmation** (show selected plan details)
- **Terms acceptance** (trial terms, billing terms)

### **Phase 7: Error Handling**

#### **7.1 Duplicate Account Detection**
```
Email check in Supabase:
├─ Found with PAID plan: Show current account details
│   ├─ Current tier: {tier}
│   ├─ Billing amount: ${amount}/month
│   ├─ Next billing: {date}
│   └─ [MANAGE ACCOUNT] [CONTACT SUPPORT]
└─ Found with FREE plan: Allow upgrade
    ├─ Current: Free plan
    ├─ Upgrading to: {selected_plan}
    └─ [CONTINUE UPGRADE]
```

#### **7.2 Payment Failure Handling**
```
Credit card fails:
├─ Show error message
├─ Send "payment failed" email
├─ Convert to free tier
├─ Allow retry with new card
└─ Track failure attempts
```

### **Phase 8: Testing & Deployment**

#### **8.1 Test Scenarios**
- **Free plan signup** (no Stripe)
- **Paid plan signup** (Stripe trial)
- **Duplicate email detection**
- **Trial expiration** (auto-conversion)
- **Payment failure** (graceful fallback)
- **Email delivery** (all templates)

#### **8.2 Monitoring**
- **Trial conversion rates**
- **Payment failure rates**
- **Email delivery success**
- **User plan distribution**

## **❓ IMPLEMENTATION QUESTIONS**

1. **Do you want me to start with the Stripe product setup guide?**
2. **Should we implement this in phases** or all at once?
3. **Any specific email service preferences** (SendGrid, AWS SES, etc.)?
4. **Testing environment** - do you have a Stripe test account?

This plan covers everything you requested and follows SaaS best practices. Ready to start implementing?
// Affordability calculation and matching logic for Singapore rental listings.

export function calculateBudgetLimits(salary, savingsGoal, dailyExpenses) {
  const monthlyExpenses = dailyExpenses * 30.5;
  const disposableIncome = Math.max(0, salary - savingsGoal - monthlyExpenses);

  // Safe Rent Limit: 30% of gross salary or 60% of disposable income (whichever is lower)
  // Clamp it to be at least $600 and at most $2500 for fresh grads
  const safeRentLimit = Math.max(
    600,
    Math.min(salary * 0.30, disposableIncome * 0.60)
  );

  // Stretch Rent Limit: 45% of gross salary or 85% of disposable income (whichever is lower)
  // Clamp it to be at least $800 and at most $4000
  const stretchRentLimit = Math.max(
    800,
    Math.min(salary * 0.45, disposableIncome * 0.85)
  );

  return {
    monthlyExpenses,
    disposableIncome,
    safeRentLimit: Math.round(safeRentLimit),
    stretchRentLimit: Math.round(stretchRentLimit)
  };
}

export function scoreAndCategorizeListings(listings, inputs, budget) {
  const {
    safeRentLimit,
    stretchRentLimit,
    disposableIncome
  } = budget;

  const {
    regions = [],
    housingTypes = [],
    mrtProximity = 'Nice to Have',
    amenities = [],
    distancePreference = 'Not Important' // Workplace / parents
  } = inputs;

  return listings.map(listing => {
    // 1. Calculate Price Score (Weight: 45%)
    let priceScore = 0;
    if (listing.rent <= safeRentLimit) {
      // Very safe, maximum price score
      priceScore = 100;
    } else if (listing.rent <= stretchRentLimit) {
      // Linear interpolation from 100 down to 60 between safe and stretch limits
      const range = stretchRentLimit - safeRentLimit;
      const position = listing.rent - safeRentLimit;
      priceScore = 100 - (position / (range || 1)) * 40;
    } else if (listing.rent <= disposableIncome) {
      // Linear interpolation from 60 down to 20 between stretch and disposable income
      const range = disposableIncome - stretchRentLimit;
      const position = listing.rent - stretchRentLimit;
      priceScore = 60 - (position / (range || 1)) * 40;
    } else {
      // Exceeds total disposable income, heavily penalized
      const overBudget = listing.rent - disposableIncome;
      priceScore = Math.max(0, 20 - (overBudget / 500) * 20);
    }

    // 2. Region Match Score (Weight: 20%)
    let regionScore = 0;
    if (regions.length === 0 || regions.includes('Any')) {
      regionScore = 100;
    } else if (regions.includes(listing.region)) {
      regionScore = 100;
    } else {
      regionScore = 0;
    }

    // 3. Housing Type Match Score (Weight: 15%)
    let typeScore = 0;
    if (housingTypes.length === 0 || housingTypes.includes('Any')) {
      typeScore = 100;
    } else if (housingTypes.includes(listing.type)) {
      typeScore = 100;
    } else {
      typeScore = 0;
    }

    // 4. MRT Proximity Score (Weight: 10%)
    let mrtScore = 0;
    if (mrtProximity === 'Not Important') {
      mrtScore = 100;
    } else if (mrtProximity === 'Very Important') {
      if (listing.walkToMrtMins <= 5) mrtScore = 100;
      else if (listing.walkToMrtMins <= 8) mrtScore = 80;
      else if (listing.walkToMrtMins <= 12) mrtScore = 50;
      else mrtScore = 20;
    } else { // Nice to Have
      if (listing.walkToMrtMins <= 8) mrtScore = 100;
      else if (listing.walkToMrtMins <= 12) mrtScore = 70;
      else mrtScore = 40;
    }

    // 5. Amenities Score (Weight: 10%)
    let amenityScore = 0;
    if (amenities.length === 0) {
      amenityScore = 100;
    } else {
      let matched = 0;
      amenities.forEach(a => {
        if (listing.amenities.includes(a)) {
          matched++;
        }
      });
      amenityScore = (matched / amenities.length) * 100;
    }

    // Combine Weighted Scores
    const matchScore = Math.round(
      priceScore * 0.45 +
      regionScore * 0.20 +
      typeScore * 0.15 +
      mrtScore * 0.10 +
      amenityScore * 0.10
    );

    // Categorize into Safe, Stretch, and Unsustainable Tiers
    // Safety must be constrained by financials, not just preference match!
    let tier = 'Unsustainable';
    
    // SAFE tier: fits >70%-100% of inputs AND rent is within the safe rent limit
    if (matchScore >= 70 && listing.rent <= safeRentLimit) {
      tier = 'Safe';
    } 
    // STRETCH tier: fits 40%-69% of inputs OR rent is within stretch rent limit (but exceeds safe)
    else if (matchScore >= 40 && listing.rent <= stretchRentLimit) {
      tier = 'Stretch';
    }
    // UNSUSTAINABLE tier: fits 10%-39% of inputs OR rent exceeds stretch rent limit
    else {
      tier = 'Unsustainable';
    }

    return {
      ...listing,
      matchScore,
      priceScore: Math.round(priceScore),
      tier
    };
  });
}

export function projectFiveYearSustainability(inputs, selectedRentTierAvg) {
  const {
    salary = 3500,
    savingsGoal = 800,
    dailyExpenses = 30
  } = inputs;

  const salaryGrowth = 0.05; // 5% salary increase annually
  const inflation = 0.03;    // 3% standard inflation on expenses and rent
  
  const safeRent = selectedRentTierAvg.Safe || 900;
  const stretchRent = selectedRentTierAvg.Stretch || 1600;
  const unsafeRent = selectedRentTierAvg.Unsustainable || 2800;

  const projections = {
    Safe: [],
    Stretch: [],
    Unsustainable: []
  };

  const tiers = [
    { key: 'Safe', baseRent: safeRent },
    { key: 'Stretch', baseRent: stretchRent },
    { key: 'Unsustainable', baseRent: unsafeRent }
  ];

  tiers.forEach(({ key, baseRent }) => {
    let cumulativeSavings = 0;
    let currentSalary = salary;
    let currentExpenses = dailyExpenses * 30.5;
    let currentRent = baseRent;
    let currentSavingsGoal = savingsGoal;

    for (let year = 1; year <= 5; year++) {
      // Annual adjustments
      if (year > 1) {
        currentSalary = currentSalary * (1 + salaryGrowth);
        currentExpenses = currentExpenses * (1 + inflation);
        currentRent = currentRent * (1 + inflation);
        currentSavingsGoal = currentSavingsGoal * (1 + inflation);
      }

      const yearlyIncome = currentSalary * 12;
      const yearlyExpenses = currentExpenses * 12;
      const yearlyRent = currentRent * 12;
      const yearlySavingsGoal = currentSavingsGoal * 12;

      // Net savings left in bank after rent and living costs
      const netYearlySavings = yearlyIncome - yearlyExpenses - yearlyRent;
      cumulativeSavings += Math.max(-50000, netYearlySavings); // Floor at -$50k debt for rendering
      
      const monthlyRemainingBuffer = currentSalary - currentExpenses - currentRent - currentSavingsGoal;

      projections[key].push({
        year,
        salary: Math.round(currentSalary),
        rent: Math.round(currentRent),
        expenses: Math.round(currentExpenses),
        savingsGoal: Math.round(currentSavingsGoal),
        cumulativeSavings: Math.round(cumulativeSavings),
        buffer: Math.round(monthlyRemainingBuffer),
        isSustainable: monthlyRemainingBuffer >= 0
      });
    }
  });

  return projections;
}

export function generateInsights(inputs, filteredListings, budget) {
  const { salary, dailyExpenses, savingsGoal, regions = [] } = inputs;
  const { safeRentLimit, stretchRentLimit, disposableIncome } = budget;

  const insights = [];

  // Insight 1: Daily expense reduction impact
  const potentialDailySavings = 10; // cutting $10 a day
  const monthlySavings = potentialDailySavings * 30.5;
  const newDisposableIncome = disposableIncome + monthlySavings;
  const newSafeLimit = Math.round(Math.min(salary * 0.30, newDisposableIncome * 0.60));
  
  // Count how many listings would be unlocked
  const currentSafeCount = filteredListings.filter(l => l.rent <= safeRentLimit).length;
  const unlockedListings = filteredListings.filter(l => l.rent > safeRentLimit && l.rent <= newSafeLimit);
  
  if (unlockedListings.length > 0) {
    insights.push({
      type: 'cost-cut',
      title: 'Reduce Daily Expenses',
      description: `Cutting daily expenses by $10/day (e.g., eating at hawker centers, switching from private hire cars to MRT) saves you $305/mo. This increases your Safe rent budget from $${safeRentLimit} to $${newSafeLimit}, unlocking ${unlockedListings.length} additional "Safe" tier housing options!`,
      metric: `+$${monthlySavings}/mo Housing Power`
    });
  } else {
    insights.push({
      type: 'cost-cut',
      title: 'Expense Optimization',
      description: `Saving $5/day on bubble tea or gourmet coffee puts $152/mo back into your pocket. This adds a critical cushion to your monthly savings buffer, helping you reach your target of $${savingsGoal}/mo faster.`,
      metric: `+$1,830 Saved Yearly`
    });
  }

  // Insight 2: Financial impact of choosing Safe vs Stretch
  const safeAvg = Math.round(safeRentLimit * 0.85);
  const stretchAvg = Math.round((safeRentLimit + stretchRentLimit) / 2);
  const monthlyDifference = stretchAvg - safeAvg;
  const yearlySavings = monthlyDifference * 12;
  const downpaymentBtoPercent = Math.round((yearlySavings * 2) / 45000 * 100); // base HDB BTO downpayment around 45k (10% of 450k flat)

  if (monthlyDifference > 150) {
    insights.push({
      type: 'tier-comparison',
      title: 'Safe vs. Stretch Compounding Impact',
      description: `Opting for a SAFE room (avg. $${safeAvg}/mo) instead of a STRETCH room (avg. $${stretchAvg}/mo) saves you $${monthlyDifference}/mo. In 2 years, this accumulates to $${yearlySavings * 2}, covering approximately ${downpaymentBtoPercent}% of the downpayment for a 4-room HDB BTO flat in Singapore!`,
      metric: `Saves $${yearlySavings}/year`
    });
  }

  // Insight 3: Location trade-off suggestions
  const preferredIsCentral = regions.includes('Central');
  if (preferredIsCentral) {
    insights.push({
      type: 'location-tip',
      title: 'The Region Trade-off',
      description: 'Your preferred region is Central, where HDB rooms average $1,000–$1,200. Expanding your search to the East (Tampines/Bedok) or North-East (Punggol/Serangoon) drops rental prices by 20% to 30%, which immediately converts your housing status from "Stretch" to "Safe" while saving you $250+/month.',
      metric: 'Save ~25% on Rent'
    });
  } else {
    insights.push({
      type: 'location-tip',
      title: 'MRT Proximity Trade-off',
      description: 'Properties within a 5-minute walk of an MRT station carry a 15-20% rental premium in Singapore. Selecting a unit 10-15 minutes away (or near a direct feeder bus route) can save you up to $200/mo, easily offsetting any extra transit costs.',
      metric: 'Save $2,400/year'
    });
  }

  // Insight 4: Savings rate health check
  const savingsRate = Math.round((savingsGoal / salary) * 100);
  if (savingsRate < 20) {
    insights.push({
      type: 'savings-health',
      title: 'Boost Your Savings Rate',
      description: `Your current savings rate is ${savingsRate}% of your salary. Financial advisors recommend saving at least 20-30% of your gross income ($${Math.round(salary * 0.20)}/mo) for long-term wealth. Prioritizing a Safe tier housing option is critical to raising this rate without compromising daily essentials.`,
      metric: `Recommended: $${Math.round(salary * 0.20)}/mo`
    });
  } else {
    insights.push({
      type: 'savings-health',
      title: 'Strong Financial Foundation',
      description: `Excellent job! Target savings of ${savingsRate}% is highly sustainable. Choosing a SAFE housing option will guarantee you can achieve this target comfortably, protecting you from rental inflation and market fluctuations.`,
      metric: `${savingsRate}% Savings Rate`
    });
  }

  return insights;
}

export async function fetchGeminiInsights(inputs, filteredListings, budget, apiKey) {
  const { salary, dailyExpenses, savingsGoal, regions = [], housingTypes = [], amenities = [], mrtProximity } = inputs;
  const { safeRentLimit, stretchRentLimit, disposableIncome } = budget;

  const prompt = `
You are a financial advisor expert in Singapore rental housing, helping fresh graduates find affordable accommodation.

User profile:
- Monthly gross salary: S$${salary}
- Target monthly savings: S$${savingsGoal}
- Daily expenses: S$${dailyExpenses} (Monthly living expenses: S$${Math.round(dailyExpenses * 30.5)})
- Preferred regions: ${regions.join(', ')}
- Preferred housing: ${housingTypes.join(', ')}
- Desired amenities: ${amenities.join(', ')}
- MRT proximity importance: ${mrtProximity}

Calculated housing limits:
- Safe rent budget: S$${safeRentLimit}/mo
- Stretch rent budget: S$${stretchRentLimit}/mo
- Net disposable income: S$${disposableIncome}/mo

Generate exactly 4 highly personalized, actionable financial insights for this user.
Identify trade-offs (e.g. cutting transport cost, roommate options, HDB rooms vs co-living, moving further from MRT, location swaps).
One insight MUST compare the Safe housing tier (avg. S$${Math.round(safeRentLimit * 0.85)}) vs Stretch housing tier (avg. S$${Math.round((safeRentLimit + stretchRentLimit) / 2)}).

Return the output strictly as a JSON array of 4 objects. Do not include markdown formatting or wrapper other than the JSON itself.
Each object in the array must follow this JSON schema:
{
  "type": "cost-cut" | "tier-comparison" | "location-tip" | "savings-health",
  "title": "Short title of the insight (max 5 words)",
  "description": "1-2 sentences of detailed advice, specific to Singapore market context.",
  "metric": "A catchy positive metric (e.g. '+$300/mo Savings' or 'Save 25% on Rent')"
}
`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      }
    );

    if (!response.ok) {
      const errBody = await response.text();
      throw new Error(`API error ${response.status}: ${errBody}`);
    }

    const data = await response.json();
    const text = data.candidates[0].content.parts[0].text;
    // Strip any markdown code fences if present
    const cleaned = text.replace(/```json\n?|```/g, '').trim();
    return JSON.parse(cleaned);
  } catch (error) {
    console.error('Failed to generate Gemini insights:', error.message);
    return generateInsights(inputs, filteredListings, budget);
  }
}

// Chat response wrapper for UI
export async function fetchChatResponse(messages, inputs, budget, apiKey) {
  // Build a prompt that includes user messages and financial context
  const { salary, dailyExpenses, savingsGoal, regions = [], housingTypes = [], amenities = [], mrtProximity } = inputs;
  const { safeRentLimit, stretchRentLimit, disposableIncome } = budget;
  const recentConversation = messages.map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n');
  const prompt = `
You are an AI housing assistant for Singapore. Use the user's financial profile and recent conversation to provide concise, actionable advice about rental affordability, cost‑cutting, and housing options.
Financial profile:
- Salary: S$${salary}
- Savings goal: S$${savingsGoal}
- Daily expenses: S$${dailyExpenses}
- Safe rent limit: S$${safeRentLimit}
- Stretch rent limit: S$${stretchRentLimit}
- Disposable income: S$${disposableIncome}
- Preferred regions: ${regions.join(', ')}
- Preferred housing types: ${housingTypes.join(', ')}
- Desired amenities: ${amenities.join(', ')}
- MRT proximity importance: ${mrtProximity}

Conversation so far:
${recentConversation}

Provide a short assistant reply (max 2 sentences) that addresses the latest user query, referencing the financial limits where relevant. Return ONLY the reply text, no JSON or markdown.
`;
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      }
    );
    if (!response.ok) {
      const errBody = await response.text();
      console.error('Gemini chat error body:', errBody);
      throw new Error(`API error ${response.status}: ${errBody}`);
    }
    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? '';
    return text || 'I could not generate a response. Please try rephrasing.';
  } catch (e) {
    console.error('Chat fetch error:', e.message);
    return 'Sorry, I could not process that right now. Check the browser console for details.';
  }
}

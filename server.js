const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = Number(process.env.PORT) || 5173;
const ROOT = __dirname;
const BASE_URL = `http://127.0.0.1:${PORT}`;
const marketCache = new Map();

const categories = [
  {
    kicker: "Online",
    title: "Make Money Online",
    description: "Remote jobs, digital products, content, marketplaces and beginner-friendly online income ideas.",
    url: "/make-money-online"
  },
  {
    kicker: "Local",
    title: "Side Hustles",
    description: "Flexible ways to earn after school, after work or on weekends without building a full company.",
    url: "/side-hustles"
  },
  {
    kicker: "Assets",
    title: "Passive Income",
    description: "Realistic recurring income paths, from dividends and royalties to templates and automation.",
    url: "/passive-income"
  },
  {
    kicker: "Startup",
    title: "Business Ideas",
    description: "Low-cost business ideas for young founders, creators, students and solo operators.",
    url: "/business-ideas"
  },
  {
    kicker: "Skills",
    title: "Freelancing",
    description: "How to package skills, price services, find clients and build a portfolio that converts.",
    url: "/freelancing"
  },
  {
    kicker: "AI",
    title: "AI Income Ideas",
    description: "Practical AI workflows, tools and products that can save time or create new revenue streams.",
    url: "/ai-income-ideas"
  },
  {
    kicker: "Money",
    title: "Personal Finance",
    description: "Save money, budget better, improve credit, pay off debt and spend with intention.",
    url: "/personal-finance"
  },
  {
    kicker: "Investing",
    title: "Investing Basics",
    description: "Beginner investing, ETFs, stocks, crypto basics, real estate and compound interest explained.",
    url: "/investing-for-beginners"
  }
];

const featuredArticles = [
  ["25 Ways to Make Money at 18", "Make Money", "/25-ways-to-make-money-at-18", "Practical ideas for students and young adults to start earning safely."],
  ["Best Side Hustles in 2026", "Side Hustles", "/best-side-hustles-2026", "Flexible side hustles with realistic startup cost, skill level and upside."],
  ["How to Save €10,000 Fast", "Saving", "/how-to-save-money-fast", "A simple plan for cutting waste, automating savings and increasing income."],
  ["Beginner Investing Guide", "Investing", "/investing-for-beginners", "Stocks, ETFs, risk and compound interest explained without jargon."],
  ["How to Make Money With AI", "AI Income", "/how-to-make-money-with-ai", "Use AI for services, content, research, templates and automation products."],
  ["Best Online Jobs for Students", "Students", "/best-online-jobs-for-students", "Remote-friendly jobs that fit around study schedules."],
  ["How to Earn €100 a Day", "Income", "/how-to-earn-100-a-day", "A practical breakdown of service, resale and online income routes."],
  ["17 Passive Income Ideas", "Passive Income", "/17-passive-income-ideas", "Realistic passive and semi-passive income ideas ranked by effort."],
  ["Best AI Tools to Make Money", "AI Tools", "/best-ai-tools-to-make-money", "AI tools for research, design, writing, video, automation and sales."],
  ["How Rich People Use Money", "Wealth", "/how-rich-people-use-money", "Assets, leverage, taxes, patience and risk management in plain English."],
  ["Best Businesses to Start Young", "Business", "/best-businesses-to-start-young", "Low-cost business models for young founders with limited capital."],
  ["Budget Calculator Guide", "Budgeting", "/budget-calculator", "Use a simple budget calculator to split income across needs, wants and savings."]
].map(([title, category, slug, excerpt], index) => ({
  id: index + 1,
  title,
  category,
  slug,
  excerpt,
  imageLabel: category
}));

const extraArticleIdeas = [
  "How to Start Freelancing With No Experience",
  "Best Apps That Pay You Real Money",
  "How to Build an Emergency Fund",
  "Credit Score Basics for Beginners",
  "Debt Snowball vs Debt Avalanche",
  "How to Invest Your First €100",
  "ETFs Explained for Beginners",
  "Crypto Basics Before You Buy",
  "Real Estate Investing Basics",
  "Compound Interest Examples",
  "How to Sell Digital Products",
  "Best Weekend Side Hustles",
  "How to Make Money on TikTok",
  "How to Make Money on YouTube",
  "How to Make Money With Canva",
  "How to Make Money With ChatGPT",
  "Best Remote Jobs for Beginners",
  "How to Negotiate a Raise",
  "How to Stop Impulse Spending",
  "Student Finance Tips",
  "How to Create a Monthly Budget",
  "How to Save Money on Groceries",
  "Best Money Habits in Your 20s",
  "How to Track Net Worth",
  "Dividend Investing Basics",
  "Index Funds vs Individual Stocks",
  "How to Read a Stock Chart",
  "What Is Risk Tolerance",
  "How to Avoid Get Rich Quick Scams",
  "Best Businesses Under €500",
  "How to Start Reselling Online",
  "How to Price Freelance Services",
  "How to Build a Personal Brand",
  "Best Niches for Affiliate Marketing",
  "How to Make Money With a Blog",
  "How to Use AdSense Properly",
  "Affiliate Marketing for Beginners",
  "How to Create a Side Hustle Plan",
  "How to Save €1,000 in 30 Days",
  "How to Turn Skills Into Income"
].map((title, index) => ({
  id: featuredArticles.length + index + 1,
  title,
  category: index % 2 === 0 ? "Money Guide" : "Opportunity",
  slug: `/${slugify(title)}`,
  excerpt: "A practical evergreen guide designed for search traffic and reader trust.",
  imageLabel: "Guide"
}));

const articles = [...featuredArticles, ...extraArticleIdeas];
const trending = featuredArticles.slice(0, 6);

const tools = [
  { id: "compound", title: "Compound Interest" },
  { id: "savings", title: "Savings Goal" },
  { id: "debt", title: "Debt Repayment" },
  { id: "salary", title: "Hourly to Salary" },
  { id: "hustle", title: "Side Hustle Profit" },
  { id: "budget", title: "Budget" }
];

const seoPages = {
  "/": ["MoneyNova | Make More Money. Build Your Future.", "MoneyNova helps you earn more, save smarter, learn investing basics and use financial tools built for SEO and real life."],
  "/make-money-online": ["Make Money Online: Real Ways to Earn | MoneyNova", "Explore realistic ways to make money online through jobs, freelance work, digital products, AI tools and content."],
  "/side-hustles": ["Best Side Hustles for Beginners | MoneyNova", "Find flexible side hustles for students, young adults and anyone who wants extra income."],
  "/passive-income": ["Passive Income Ideas That Are Realistic | MoneyNova", "Learn practical passive and semi-passive income ideas without hype."],
  "/business-ideas": ["Business Ideas to Start Young | MoneyNova", "Low-cost business ideas for students, creators and young adults who want to build income."],
  "/freelancing": ["Freelancing for Beginners | MoneyNova", "Learn how to package skills, price services, find clients and build freelance income."],
  "/ai-income-ideas": ["AI Income Ideas | MoneyNova", "Explore practical ways to use AI tools for services, content, automation and digital products."],
  "/personal-finance": ["Personal Finance Basics | MoneyNova", "Save money, budget better, improve credit, pay off debt and make smarter spending decisions."],
  "/investing-for-beginners": ["Investing for Beginners | MoneyNova", "Understand stocks, ETFs, crypto basics, real estate and compound interest before investing."],
  "/budget-calculator": ["Budget Calculator | MoneyNova", "Use MoneyNova's budget calculator to plan needs, wants, savings and debt payments."],
  "/compound-interest-calculator": ["Compound Interest Calculator | MoneyNova", "Estimate how money can grow over time with monthly contributions and annual returns."],
  "/savings-goal-calculator": ["Savings Goal Calculator | MoneyNova", "Calculate how much you need to save each month to reach a financial goal."],
  "/debt-repayment-calculator": ["Debt Repayment Calculator | MoneyNova", "Estimate how long it may take to pay off debt based on balance, APR and monthly payments."],
  "/hourly-to-salary-calculator": ["Hourly to Salary Calculator | MoneyNova", "Convert hourly pay into weekly, monthly and annual salary estimates."],
  "/side-hustle-profit-calculator": ["Side Hustle Profit Calculator | MoneyNova", "Estimate side hustle profit after costs and tax reserves."],
  "/how-to-save-money-fast": ["How to Save Money Fast | MoneyNova", "Simple strategies to cut expenses, build savings and reach money goals faster."]
};

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === "GET" && url.pathname === "/api/health") {
    return sendJson(res, { ok: true, app: "MoneyNova" });
  }

  if (req.method === "GET" && url.pathname === "/api/content") {
    return sendJson(res, { categories, articles, trending, tools });
  }

  if (req.method === "GET" && url.pathname === "/api/articles") {
    return sendJson(res, articles);
  }

  if (req.method === "GET" && url.pathname === "/api/market-analysis") {
    const symbol = sanitizeSymbol(url.searchParams.get("symbol") || "");
    if (!symbol) return sendJson(res, { error: "Enter a valid ticker symbol." }, 400);

    try {
      const analysis = await analyzeMarket(symbol);
      return sendJson(res, analysis);
    } catch (error) {
      return sendJson(res, { error: error.message || "Market data unavailable. Try again later." }, 502);
    }
  }

  if (req.method === "GET" && url.pathname === "/sitemap.xml") {
    return sendXml(res, buildSitemap());
  }

  if (req.method === "GET" && shouldServeApp(url.pathname)) {
    return serveIndex(url.pathname, req, res);
  }

  serveStatic(url.pathname, res);
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`MoneyNova running at ${BASE_URL}`);
});

async function analyzeMarket(symbol) {
  const cacheKey = symbol;
  const cached = marketCache.get(cacheKey);
  if (cached && Date.now() - cached.createdAt < 5 * 60 * 1000) return cached.data;

  const endpoint = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=6mo&interval=1d`;
  const response = await fetch(endpoint, {
    headers: {
      "User-Agent": "MoneyNova educational market analyzer"
    }
  });

  if (!response.ok) throw new Error("Could not reach market data provider.");
  const payload = await response.json();
  const result = payload.chart?.result?.[0];
  if (!result) throw new Error("Ticker not found or no chart data available.");

  const quote = result.indicators?.quote?.[0] || {};
  const closes = (quote.close || []).filter((value) => typeof value === "number" && Number.isFinite(value));
  if (closes.length < 30) throw new Error("Not enough market history to estimate risk.");

  const price = closes.at(-1);
  const first = closes[0];
  const sixMonthReturn = ((price - first) / first) * 100;
  const returns = closes.slice(1).map((close, index) => (close - closes[index]) / closes[index]);
  const volatility = standardDeviation(returns) * Math.sqrt(252) * 100;
  const maxDrawdown = calculateMaxDrawdown(closes);
  const sma50 = average(closes.slice(-50));
  const sma120 = average(closes.slice(-120));
  const trendScore = price > sma50 ? 1 : -1;
  const longTrendScore = price > sma120 ? 1 : -1;

  let riskScore = 45;
  if (volatility > 45) riskScore += 25;
  else if (volatility > 30) riskScore += 15;
  else if (volatility < 20) riskScore -= 10;

  if (maxDrawdown < -35) riskScore += 25;
  else if (maxDrawdown < -22) riskScore += 14;
  else if (maxDrawdown > -12) riskScore -= 8;

  if (sixMonthReturn < -15) riskScore += 14;
  if (trendScore < 0) riskScore += 10;
  if (longTrendScore < 0) riskScore += 8;
  if (sixMonthReturn > 15 && trendScore > 0) riskScore -= 8;

  riskScore = clamp(riskScore, 1, 99);
  const rating = riskScore >= 68 ? "High risk" : riskScore >= 42 ? "Balanced risk" : "Lower risk";
  const signals = [
    price > sma50 ? "Price is above its 50-day average, which supports short-term momentum." : "Price is below its 50-day average, which can signal weaker momentum.",
    price > sma120 ? "Price is above its longer moving average, suggesting the broader trend is still constructive." : "Price is below its longer moving average, so trend risk is elevated.",
    volatility > 35 ? "Volatility is high compared with many large-cap stocks, so position sizing matters." : "Volatility is not extreme over the recent sample.",
    maxDrawdown < -25 ? "The recent drawdown has been deep, which increases downside-risk awareness." : "Recent drawdown has been relatively controlled."
  ];

  const analysis = {
    symbol,
    price,
    sixMonthReturn,
    volatility,
    maxDrawdown,
    riskScore,
    rating,
    signals,
    summary: `${symbol} currently screens as ${rating.toLowerCase()} with a risk score of ${riskScore}/100 based on recent trend, volatility and drawdown.`,
    disclaimer: "Educational market snapshot only. Not financial advice, not a recommendation to buy, sell or hold."
  };

  marketCache.set(cacheKey, { createdAt: Date.now(), data: analysis });
  return analysis;
}

function serveIndex(requestPath, req, res) {
  const indexPath = path.join(ROOT, "index.html");
  const [title, description] = seoPages[requestPath] || getArticleMeta(requestPath) || seoPages["/"];
  const canonical = `${BASE_URL}${requestPath}`;

  fs.readFile(indexPath, "utf8", (error, html) => {
    if (error) {
      res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Could not load app");
      return;
    }

    const output = html
      .replaceAll("{{META_TITLE}}", escapeHtml(title))
      .replaceAll("{{META_DESCRIPTION}}", escapeHtml(description))
      .replaceAll("{{CANONICAL_URL}}", escapeHtml(canonical));

    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(output);
  });
}

function serveStatic(requestPath, res) {
  const safePath = path.normalize(decodeURIComponent(requestPath)).replace(/^(\.\.[/\\])+/, "");
  const filePath = path.join(ROOT, safePath);

  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (error, content) => {
    if (error) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Not found");
      return;
    }

    res.writeHead(200, { "Content-Type": getContentType(filePath) });
    res.end(content);
  });
}

function shouldServeApp(requestPath) {
  if (requestPath === "/") return true;
  if (seoPages[requestPath]) return true;
  return articles.some((article) => article.slug === requestPath);
}

function getArticleMeta(requestPath) {
  const article = articles.find((item) => item.slug === requestPath);
  if (!article) return null;
  return [`${article.title} | MoneyNova`, article.excerpt];
}

function buildSitemap() {
  const urls = ["/", ...Object.keys(seoPages).filter((url) => url !== "/"), ...articles.map((article) => article.slug)];
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((url) => `  <url><loc>${BASE_URL}${url}</loc></url>`).join("\n")}
</urlset>`;
}

function sendJson(res, data, status = 200) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(data));
}

function sendXml(res, data) {
  res.writeHead(200, { "Content-Type": "application/xml; charset=utf-8" });
  res.end(data);
}

function getContentType(filePath) {
  const ext = path.extname(filePath);
  const types = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg"
  };

  return types[ext] || "application/octet-stream";
}

function slugify(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function sanitizeSymbol(value) {
  return value.toUpperCase().replace(/[^A-Z0-9.-]/g, "").slice(0, 12);
}

function average(values) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function standardDeviation(values) {
  const avg = average(values);
  const variance = average(values.map((value) => (value - avg) ** 2));
  return Math.sqrt(variance);
}

function calculateMaxDrawdown(values) {
  let peak = values[0];
  let maxDrawdown = 0;
  values.forEach((value) => {
    peak = Math.max(peak, value);
    maxDrawdown = Math.min(maxDrawdown, ((value - peak) / peak) * 100);
  });
  return maxDrawdown;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char]);
}

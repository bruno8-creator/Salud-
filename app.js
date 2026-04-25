const categoryGrid = document.querySelector("#categoryGrid");
const articleGrid = document.querySelector("#articleGrid");
const trendingList = document.querySelector("#trendingList");
const siteSearch = document.querySelector("#siteSearch");
const searchCount = document.querySelector("#searchCount");
const toolTabs = document.querySelector("#toolTabs");
const calculatorPanel = document.querySelector("#calculatorPanel");
const stockForm = document.querySelector("#stockForm");
const stockSymbol = document.querySelector("#stockSymbol");
const stockResult = document.querySelector("#stockResult");
const themeToggle = document.querySelector("#themeToggle");
const newsletterForm = document.querySelector("#newsletterForm");

let content = { categories: [], articles: [], tools: [] };
let activeTool = "compound";
const articleDetail = document.querySelector("#articleDetail");
const articlePath = window.location.pathname;

init();

async function init() {
  setupTheme();
  setupReveal();
  setupForms();
  content = await getJson("/api/content", fallbackContent());
  renderArticlePageIfNeeded(content.articles);
  renderCategories(content.categories);
  renderArticles(content.articles);
  renderTrending(content.trending || content.articles.slice(0, 6));
  renderToolTabs(content.tools);
  renderCalculator(activeTool);
}

function renderArticlePageIfNeeded(articles) {
  const article = articles.find((item) => item.slug === articlePath);
  if (!article) return;

  document.body.classList.add("article-mode");
  articleDetail.hidden = false;
  articleDetail.innerHTML = `
    <div class="article-hero reveal is-visible">
      <a class="back-link" href="/#articles">Back to all articles</a>
      <span>${article.category}</span>
      <h1>${article.title}</h1>
      <p>${article.excerpt}</p>
      <div class="article-meta">
        <strong>MoneyNova Editorial</strong>
        <span>${article.readTime}</span>
        <span>Updated 2026</span>
      </div>
    </div>

    <div class="article-body-layout">
      <aside class="article-toc">
        <strong>In this guide</strong>
        <a href="#quick-takeaways">Quick takeaways</a>
        ${article.sections.map((section, index) => `<a href="#section-${index + 1}">${section.heading}</a>`).join("")}
        <a href="#article-faq">FAQ</a>
      </aside>

      <div class="article-body">
        <div class="ad-slot article-ad">AdSense placement</div>
        <section id="quick-takeaways">
          <h2>Quick takeaways</h2>
          <ul>
            ${article.takeaways.map((item) => `<li>${item}</li>`).join("")}
          </ul>
        </section>
        ${article.sections.map((section, index) => `
          <section id="section-${index + 1}">
            <h2>${section.heading}</h2>
            ${section.paragraphs.map((paragraph) => `<p>${paragraph}</p>`).join("")}
            <ul>
              ${section.points.map((point) => `<li>${point}</li>`).join("")}
            </ul>
          </section>
        `).join("")}
        <section class="article-warning">
          <h2>Important note</h2>
          <p>${article.disclaimer}</p>
        </section>
        <section id="article-faq" class="article-faq">
          <h2>FAQ</h2>
          ${article.faq.map((item) => `
            <details>
              <summary>${item.question}</summary>
              <p>${item.answer}</p>
            </details>
          `).join("")}
        </section>
      </div>

      <aside class="related-box">
        <h3>Related articles</h3>
        ${articles
          .filter((item) => item.slug !== article.slug)
          .slice(0, 5)
          .map((item) => `<a href="${item.slug}">${item.title}</a>`)
          .join("")}
      </aside>
    </div>
  `;
}

function setupTheme() {
  const stored = localStorage.getItem("theme");
  if (stored === "dark") document.documentElement.classList.add("dark");

  themeToggle.addEventListener("click", () => {
    document.documentElement.classList.toggle("dark");
    localStorage.setItem("theme", document.documentElement.classList.contains("dark") ? "dark" : "light");
  });
}

function setupReveal() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.14 }
  );

  document.querySelectorAll(".reveal").forEach((item) => observer.observe(item));
}

function setupForms() {
  siteSearch.addEventListener("input", () => {
    const query = siteSearch.value.trim().toLowerCase();
    const filtered = content.articles.filter((article) =>
      `${article.title} ${article.category} ${article.excerpt}`.toLowerCase().includes(query)
    );
    renderArticles(query ? filtered : content.articles);
    searchCount.textContent = query ? `${filtered.length} results` : "50+ guides and tools";
  });

  stockForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const symbol = stockSymbol.value.trim().toUpperCase();
    if (!symbol) return;

    stockResult.className = "stock-result loading";
    stockResult.innerHTML = `<strong>Analyzing ${escapeHtml(symbol)}...</strong><p>Checking recent price action, trend, volatility and drawdown.</p>`;

    const analysis = await getJson(`/api/market-analysis?symbol=${encodeURIComponent(symbol)}`, null);
    renderStockAnalysis(analysis);
  });

  newsletterForm.addEventListener("submit", (event) => {
    event.preventDefault();
    newsletterForm.innerHTML = `<strong>You're in. Welcome to MoneyNova.</strong>`;
  });
}

function renderCategories(categories) {
  categoryGrid.innerHTML = categories
    .map(
      (category) => `
        <article class="category-card reveal">
          <span>${category.kicker}</span>
          <h3>${category.title}</h3>
          <p>${category.description}</p>
          <a href="${category.url}">Explore guides</a>
        </article>
      `
    )
    .join("");
  refreshReveal(".category-card.reveal");
}

function renderArticles(articles) {
  articleGrid.innerHTML = articles
    .slice(0, 12)
    .map(
      (article) => `
        <article class="article-card reveal">
          <div class="article-image">${article.imageLabel}</div>
          <span>${article.category}</span>
          <h3>${article.title}</h3>
          <p>${article.excerpt}</p>
          <a href="${article.slug}">Read article</a>
        </article>
      `
    )
    .join("");
  refreshReveal(".article-card.reveal");
}

function renderTrending(items) {
  trendingList.innerHTML = items
    .slice(0, 6)
    .map((item) => `<li><a href="${item.slug}">${item.title}</a></li>`)
    .join("");
}

function renderToolTabs(tools) {
  toolTabs.innerHTML = tools
    .map(
      (tool) => `
        <button class="${tool.id === activeTool ? "active" : ""}" data-tool="${tool.id}" type="button">
          ${tool.title}
        </button>
      `
    )
    .join("");

  toolTabs.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => {
      activeTool = button.dataset.tool;
      renderToolTabs(content.tools);
      renderCalculator(activeTool);
    });
  });
}

function renderCalculator(toolId) {
  const templates = {
    compound: {
      title: "Compound Interest Calculator",
      fields: [
        ["principal", "Initial amount", 1000],
        ["monthly", "Monthly contribution", 150],
        ["rate", "Annual return %", 7],
        ["years", "Years", 10]
      ],
      calculate: ({ principal, monthly, rate, years }) => {
        const monthlyRate = rate / 100 / 12;
        const months = years * 12;
        let value = principal;
        for (let i = 0; i < months; i += 1) value = value * (1 + monthlyRate) + monthly;
        return `Estimated future value: ${formatMoney(value)}`;
      }
    },
    savings: {
      title: "Savings Goal Calculator",
      fields: [
        ["goal", "Savings goal", 10000],
        ["saved", "Already saved", 1500],
        ["months", "Months", 18]
      ],
      calculate: ({ goal, saved, months }) => `Monthly target: ${formatMoney((goal - saved) / months)}`
    },
    debt: {
      title: "Debt Repayment Calculator",
      fields: [
        ["debt", "Debt balance", 5000],
        ["payment", "Monthly payment", 250],
        ["rate", "APR %", 18]
      ],
      calculate: ({ debt, payment, rate }) => {
        const monthlyRate = rate / 100 / 12;
        let balance = debt;
        let months = 0;
        while (balance > 0 && months < 600) {
          balance = balance * (1 + monthlyRate) - payment;
          months += 1;
        }
        return months >= 600 ? "Payment is too low to estimate payoff." : `Debt-free estimate: ${months} months`;
      }
    },
    salary: {
      title: "Hourly to Salary Calculator",
      fields: [
        ["hourly", "Hourly rate", 18],
        ["hours", "Hours per week", 40]
      ],
      calculate: ({ hourly, hours }) => `Annual salary estimate: ${formatMoney(hourly * hours * 52)}`
    },
    hustle: {
      title: "Side Hustle Profit Calculator",
      fields: [
        ["revenue", "Monthly revenue", 1200],
        ["costs", "Monthly costs", 260],
        ["tax", "Tax reserve %", 20]
      ],
      calculate: ({ revenue, costs, tax }) => `Estimated monthly profit: ${formatMoney((revenue - costs) * (1 - tax / 100))}`
    },
    budget: {
      title: "Budget Calculator",
      fields: [
        ["income", "Monthly income", 2400],
        ["needs", "Needs %", 50],
        ["wants", "Wants %", 30],
        ["savings", "Savings %", 20]
      ],
      calculate: ({ income, needs, wants, savings }) =>
        `Needs: ${formatMoney(income * needs / 100)} · Wants: ${formatMoney(income * wants / 100)} · Savings: ${formatMoney(income * savings / 100)}`
    }
  };

  const tool = templates[toolId] || templates.compound;
  calculatorPanel.innerHTML = `
    <h3>${tool.title}</h3>
    <form id="calculatorForm" class="calculator-form">
      ${tool.fields.map(([id, label, value]) => `
        <label>
          ${label}
          <input name="${id}" type="number" step="0.01" value="${value}" />
        </label>
      `).join("")}
      <button class="primary-button" type="submit">Calculate</button>
    </form>
    <div class="calculator-result" id="calculatorResult">Adjust the numbers and calculate.</div>
  `;

  document.querySelector("#calculatorForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget).entries());
    Object.keys(values).forEach((key) => {
      values[key] = Number(values[key]);
    });
    document.querySelector("#calculatorResult").textContent = tool.calculate(values);
  });
}

function renderStockAnalysis(analysis) {
  if (!analysis || analysis.error) {
    stockResult.className = "stock-result danger";
    stockResult.innerHTML = `<strong>Could not analyze that ticker.</strong><p>${analysis?.error || "Try another listed symbol such as AAPL or MSFT."}</p>`;
    return;
  }

  const tone = analysis.rating === "High risk" ? "danger" : analysis.rating === "Balanced risk" ? "warning" : "good";
  stockResult.className = `stock-result ${tone}`;
  stockResult.innerHTML = `
    <div class="risk-header">
      <span>${analysis.symbol}</span>
      <strong>${analysis.rating}</strong>
    </div>
    <p>${analysis.summary}</p>
    <div class="market-grid">
      <div><small>Price</small><strong>${formatMoney(analysis.price, "USD")}</strong></div>
      <div><small>6M return</small><strong>${formatPercent(analysis.sixMonthReturn)}</strong></div>
      <div><small>Volatility</small><strong>${formatPercent(analysis.volatility)}</strong></div>
      <div><small>Max drawdown</small><strong>${formatPercent(analysis.maxDrawdown)}</strong></div>
    </div>
    <ul>
      ${analysis.signals.map((signal) => `<li>${signal}</li>`).join("")}
    </ul>
    <p class="fine-print">${analysis.disclaimer}</p>
  `;
}

async function getJson(path, fallback) {
  try {
    const response = await fetch(path);
    if (!response.ok) throw new Error("Request failed");
    return await response.json();
  } catch {
    return fallback;
  }
}

function refreshReveal(selector) {
  setTimeout(() => {
    document.querySelectorAll(selector).forEach((item) => item.classList.add("is-visible"));
  }, 80);
}

function formatMoney(value, currency = "EUR") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(value);
}

function formatPercent(value) {
  return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char]);
}

function fallbackContent() {
  return {
    categories: [],
    articles: [],
    trending: [],
    tools: [
      { id: "compound", title: "Compound Interest" },
      { id: "savings", title: "Savings Goal" },
      { id: "debt", title: "Debt Repayment" },
      { id: "salary", title: "Hourly to Salary" },
      { id: "hustle", title: "Side Hustle Profit" },
      { id: "budget", title: "Budget" }
    ]
  };
}

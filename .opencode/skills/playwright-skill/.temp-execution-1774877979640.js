const { chromium } = require("playwright");

const TARGET_URL = "http://localhost:3002";

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 200 });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();

  console.log("=== Color Palette Visual Verification ===\n");

  // 1. Navigate to main page (likely login or dashboard)
  console.log("1. Loading app...");
  await page.goto(TARGET_URL, { waitUntil: "networkidle", timeout: 15000 });
  await page.waitForTimeout(1000);
  console.log("   Page loaded:", await page.title());
  console.log("   URL:", page.url());
  await page.screenshot({ path: "/tmp/color-01-initial.png", fullPage: true });
  console.log("   Screenshot: /tmp/color-01-initial.png");

  // 2. Check current theme
  const currentTheme = await page.evaluate(() =>
    document.documentElement.getAttribute("data-theme")
  );
  console.log(`\n2. Current theme: ${currentTheme}`);

  // 3. Verify CSS variables are applied
  console.log("\n3. Checking CSS variables...");
  const cssVars = await page.evaluate(() => {
    const style = getComputedStyle(document.documentElement);
    return {
      bgBase: style.getPropertyValue("--bg-base").trim(),
      bgSurface: style.getPropertyValue("--bg-surface").trim(),
      bgRaised: style.getPropertyValue("--bg-raised").trim(),
      textPrimary: style.getPropertyValue("--text-primary").trim(),
      textSecondary: style.getPropertyValue("--text-secondary").trim(),
      accent: style.getPropertyValue("--accent").trim(),
      accentSubtle: style.getPropertyValue("--accent-subtle").trim(),
      borderSubtle: style.getPropertyValue("--border-subtle").trim(),
    };
  });
  console.log("   CSS Variables:");
  for (const [key, value] of Object.entries(cssVars)) {
    console.log(`     --${key}: ${value}`);
  }

  // 4. Check for any remaining old palette colors in computed styles
  console.log("\n4. Scanning for old palette colors in visible elements...");
  const oldColorCheck = await page.evaluate(() => {
    const oldColors = [
      "rgb(212, 132, 90)", // old terra #d4845a
      "rgb(30, 28, 26)",   // old ink #1e1c1a
      "rgb(250, 248, 244)", // old parchment #faf8f4
      "rgb(240, 233, 220)", // old linen #f0e9dc
      "rgb(226, 212, 192)", // old sand #e2d4c0
      "rgb(200, 180, 154)", // old oat #c8b49a
    ];
    const matches = [];
    const elements = document.querySelectorAll("*");
    for (const el of elements) {
      const style = getComputedStyle(el);
      for (const color of oldColors) {
        if (style.color === color) {
          matches.push({ tag: el.tagName, property: "color", value: color, text: el.textContent?.slice(0, 30) });
        }
        if (style.backgroundColor === color) {
          matches.push({ tag: el.tagName, property: "background-color", value: color, text: el.textContent?.slice(0, 30) });
        }
        if (style.borderColor === color) {
          matches.push({ tag: el.tagName, property: "border-color", value: color, text: el.textContent?.slice(0, 30) });
        }
      }
    }
    return matches;
  });

  if (oldColorCheck.length === 0) {
    console.log("   No old palette colors found in rendered elements.");
  } else {
    console.log(`   WARNING: Found ${oldColorCheck.length} old palette colors:`);
    for (const m of oldColorCheck) {
      console.log(`     <${m.tag}> ${m.property}: ${m.value} ("${m.text}")`);
    }
  }

  // 5. Try to navigate to main app pages
  console.log("\n5. Navigating through pages...");

  // Check if we're on login page
  const isLoginPage = page.url().includes("/login") || page.url().includes("/auth");

  if (isLoginPage) {
    console.log("   On login page - taking screenshot...");
    await page.screenshot({ path: "/tmp/color-02-login-light.png", fullPage: true });
    console.log("   Screenshot: /tmp/color-02-login-light.png");

    // Try dark mode on login
    console.log("\n   Switching to dark mode via JS...");
    await page.evaluate(() => {
      document.documentElement.setAttribute("data-theme", "dark");
      localStorage.setItem("bf-theme", "dark");
    });
    await page.waitForTimeout(500);
    await page.screenshot({ path: "/tmp/color-03-login-dark.png", fullPage: true });
    console.log("   Screenshot: /tmp/color-03-login-dark.png");

    // Check dark mode CSS vars
    const darkVars = await page.evaluate(() => {
      const style = getComputedStyle(document.documentElement);
      return {
        bgBase: style.getPropertyValue("--bg-base").trim(),
        bgSurface: style.getPropertyValue("--bg-surface").trim(),
        textPrimary: style.getPropertyValue("--text-primary").trim(),
        accent: style.getPropertyValue("--accent").trim(),
      };
    });
    console.log("   Dark mode CSS Variables:");
    for (const [key, value] of Object.entries(darkVars)) {
      console.log(`     --${key}: ${value}`);
    }

    // Switch back to light
    await page.evaluate(() => {
      document.documentElement.setAttribute("data-theme", "light");
      localStorage.setItem("bf-theme", "light");
    });
    await page.waitForTimeout(300);

    // Navigate to signup
    console.log("\n   Navigating to signup...");
    await page.goto(`${TARGET_URL}/signup`, { waitUntil: "networkidle", timeout: 10000 });
    await page.waitForTimeout(500);
    await page.screenshot({ path: "/tmp/color-04-signup-light.png", fullPage: true });
    console.log("   Screenshot: /tmp/color-04-signup-light.png");

    // Navigate to forgot-password
    console.log("   Navigating to forgot-password...");
    await page.goto(`${TARGET_URL}/forgot-password`, { waitUntil: "networkidle", timeout: 10000 });
    await page.waitForTimeout(500);
    await page.screenshot({ path: "/tmp/color-05-forgot-light.png", fullPage: true });
    console.log("   Screenshot: /tmp/color-05-forgot-light.png");
  }

  // 6. Try navigating to dashboard/main routes (may redirect to login if auth required)
  console.log("\n6. Attempting to view app pages...");
  const pages = ["/", "/library", "/spaces", "/digest"];
  for (const path of pages) {
    try {
      await page.goto(`${TARGET_URL}${path}`, { waitUntil: "networkidle", timeout: 8000 });
      await page.waitForTimeout(500);
      const url = page.url();
      const name = path === "/" ? "home" : path.slice(1);
      await page.screenshot({ path: `/tmp/color-page-${name}.png`, fullPage: true });
      console.log(`   ${path} -> ${url} (screenshot: /tmp/color-page-${name}.png)`);
    } catch (e) {
      console.log(`   ${path} -> Error: ${e.message}`);
    }
  }

  // 7. Dark mode comparison for authenticated pages
  console.log("\n7. Dark mode on current page...");
  await page.evaluate(() => {
    document.documentElement.setAttribute("data-theme", "dark");
    localStorage.setItem("bf-theme", "dark");
  });
  await page.waitForTimeout(500);
  await page.screenshot({ path: "/tmp/color-07-dark-current.png", fullPage: true });
  console.log("   Screenshot: /tmp/color-07-dark-current.png");

  // 8. Verify no old warm tones in dark mode
  const darkOldColorCheck = await page.evaluate(() => {
    const oldColors = [
      "rgb(42, 39, 37)",   // old dark-surface #2a2725
      "rgb(54, 50, 47)",   // old dark-raised #36322f
      "rgb(62, 58, 54)",   // old dark-border #3e3a36
      "rgb(58, 42, 32)",   // old dark-accent-subtle #3a2a20
    ];
    const matches = [];
    const elements = document.querySelectorAll("*");
    for (const el of elements) {
      const style = getComputedStyle(el);
      for (const color of oldColors) {
        if (style.backgroundColor === color) {
          matches.push({ tag: el.tagName, property: "background-color", value: color });
        }
      }
    }
    return matches;
  });

  if (darkOldColorCheck.length === 0) {
    console.log("   No old dark mode warm-tone colors found.");
  } else {
    console.log(`   WARNING: Found ${darkOldColorCheck.length} old dark mode colors:`);
    for (const m of darkOldColorCheck) {
      console.log(`     <${m.tag}> ${m.property}: ${m.value}`);
    }
  }

  // Reset to light mode
  await page.evaluate(() => {
    document.documentElement.setAttribute("data-theme", "light");
    localStorage.setItem("bf-theme", "light");
  });

  console.log("\n=== Verification Complete ===");
  console.log("Screenshots saved to /tmp/color-*.png");
  console.log("Review them to verify the new emerald/neutral palette is applied correctly.");

  await browser.close();
})();

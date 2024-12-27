const puppeteer = require("puppeteer");

async function extractButtonText() {
  //   const browser = await puppeteer.launch({
  //     headless: false,
  //     devtools: true,
  //   });

  const browser = await puppeteer.launch();

  const page = await browser.newPage();

  // Enable console logging
  page.on("console", (msg) => console.log("Page log:", msg.text()));

  await page.goto("https://www.jefit.com/exercises");

  const results = await page.evaluate(async () => {
    const muscleGroups = document.querySelectorAll(
      "div.flex.overflow-x-auto.gap-4 button"
    );

    const exercises = document.querySelectorAll(
      "div.flex.flex-wrap.gap-x-12.gap-y-6.mt-10.justify-center.items-center a"
    );

    console.log(`Found ${muscleGroups.length} buttons`);
    console.log(`Found ${exercises.length} exercises`);

    muscleGroups.forEach(async (button, index) => {
      const text = button.querySelector("p")?.textContent.trim();
      console.log(`Button ${index}: ${text}`);

      if (text === "Abs") {
        button.click();

        await new Promise((resolve) => setTimeout(resolve, 2000));

        const exercises = document.querySelectorAll(
          "div.flex.flex-wrap.gap-x-12.gap-y-6.mt-10.justify-center.items-center a"
        );

        console.log("🚀 ~ muscleGroups.forEach ~ exercises:", exercises.length);
      }
    });

    return "hello";
  });

  // Wait for debugging
  await new Promise((resolve) => setTimeout(resolve, 5000));

  await browser.close();
  return results;
}

extractButtonText().catch(console.error);

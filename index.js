const puppeteer = require("puppeteer");

async function extractExercises() {
  const browser = await puppeteer.launch({
    headless: "new", // Using new headless mode
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();

    // Enable console logging from the page
    page.on("console", (msg) => console.log("Page log:", msg.text()));

    // Navigate to the page and wait for content to load
    await page.goto("https://www.jefit.com/exercises", {
      waitUntil: "networkidle0",
      timeout: 30000,
    });

    // Wait for the muscle group buttons to be present
    await page.waitForSelector("div.flex.overflow-x-auto.gap-4 button");

    const results = await page.evaluate(async () => {
      const data = [];

      // Get all muscle group buttons
      const muscleGroups = document.querySelectorAll(
        "div.flex.overflow-x-auto.gap-4 button"
      );

      for (const button of muscleGroups) {
        const muscleGroup = button.querySelector("p")?.textContent.trim();

        // Click the button and wait for new exercises to load
        await new Promise((resolve) => {
          button.click();
          setTimeout(resolve, 2000); // Wait for content to update
        });

        // Get exercises for this muscle group
        const exercises = document.querySelectorAll(
          "div.flex.flex-wrap.gap-x-12.gap-y-6.mt-10.justify-center.items-center a"
        );

        const exerciseList = [];
        exercises.forEach((exercise) => {
          const nameElement = exercise.querySelector(
            "div.h-28.p-4.bg-white.rounded-b-xl.flex.flex-col.justify-around.items-start p"
          );

          const imgElement = exercise.querySelector("img");

          if (nameElement) {
            exerciseList.push({
              name: nameElement.textContent.trim(),
              type: "Body Weight", // You might want to extract this dynamically
              img: imgElement ? imgElement.src : "",
            });
          }
        });

        data.push({
          muscleGroups: muscleGroup,
          exercises: exerciseList,
        });
      }

      return data;
    });

    return results;
  } catch (error) {
    console.error("Scraping failed:", error);
    throw error;
  } finally {
    await browser.close();
  }
}

// Execute the scraper with proper error handling
(async () => {
  try {
    const exercises = await extractExercises();
    console.log("Scraped exercises:", JSON.stringify(exercises, null, 2));
  } catch (error) {
    console.error("Failed to extract exercises:", error);
  }
})();

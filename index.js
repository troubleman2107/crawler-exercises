const puppeteer = require("puppeteer");

async function extractExercises() {
  const browser = await puppeteer.launch({
    headless: "new",
    // headless: false,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();

    page.on("console", (msg) => console.log("Page log:", msg.text()));

    await page.goto("https://www.jefit.com/exercises", {
      waitUntil: "networkidle0",
      timeout: 30000,
    });

    await page.waitForSelector("div.flex.overflow-x-auto.gap-4 button");

    const results = await page.evaluate(async () => {
      const data = [];

      // Helper function to extract exercises from current page
      const extractExercisesFromPage = () => {
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
              type: "Body Weight",
              img: imgElement ? imgElement.src : "",
            });
          }
        });
        return exerciseList;
      };

      const muscleGroupsMultiple = document.querySelectorAll(
        "div.flex.overflow-x-auto.gap-4"
      );

      const muscleGroups = muscleGroupsMultiple[0].querySelectorAll("button");

      for (const button of muscleGroups) {
        const muscleGroup = button.querySelector("p")?.textContent.trim();
        console.log(`Processing muscle group: ${muscleGroup}`);

        let allExercises = [];

        // if (muscleGroup === "Abs" || muscleGroup === "Back") {
        button.click();
        // Click the muscle group button
        await new Promise((resolve) => setTimeout(resolve, 2000));
        // Get exercises from first page
        const firstPageExercises = extractExercisesFromPage();
        allExercises = [...allExercises, ...firstPageExercises];
        console.log(
          `Found ${firstPageExercises.length} exercises on page 1 for ${muscleGroup}`
        );

        // Check for pagination
        const paginationLinks = document.querySelectorAll(
          'a[aria-label^="Page"]'
        );

        const arrPagination = Array.from(paginationLinks).map((item) =>
          item.getAttribute("aria-label")
        );

        const totalLenght =
          arrPagination[arrPagination.length - 1].match(/\d+/)[0];

        console.log("totalLenght", totalLenght);

        const totalPages =
          paginationLinks.length > 0 ? paginationLinks.length : 1;

        // Process remaining pages if they exist
        if (totalPages > 1) {
          for (let page = 2; page <= totalLenght; page++) {
            const pageLink = document.querySelector(
              `a[aria-label="Page ${page}"]`
            );
            if (pageLink) {
              pageLink.click();
              await new Promise((resolve) => setTimeout(resolve, 2000));

              const pageExercises = extractExercisesFromPage();
              allExercises = [...allExercises, ...pageExercises];
              console.log(
                `Found ${pageExercises.length} exercises on page ${page} for ${muscleGroup}`
              );
            }
          }
        }

        data.push({
          muscleGroups: muscleGroup,
          exercises: allExercises,
          totalExercises: allExercises.length,
        });

        button.click();
        // }
      }

      return data;
    });

    return results;
  } catch (error) {
    console.error("Scraping failed:", error);
    throw error;
  } finally {
    await new Promise((resolve) => setTimeout(resolve, 20000));

    await browser.close();
  }
}

// Execute the scraper
(async () => {
  try {
    const exercises = await extractExercises();
    console.log("Scraped exercises:", JSON.stringify(exercises, null, 2));

    // Save to file
    const fs = require("fs");
    fs.writeFileSync("exercises.json", JSON.stringify(exercises, null, 2));
    console.log("Data saved to exercises.json");
  } catch (error) {
    console.error("Failed to extract exercises:", error);
  }
})();

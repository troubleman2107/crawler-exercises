const puppeteer = require("puppeteer");
const fs = require("fs");
const cliProgress = require("cli-progress");
const colors = require("ansi-colors");

const URLPage = "https://www.jefit.com";

async function extractExercises() {
  const browser = await puppeteer.launch({
    headless: false,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  // Create progress bars
  const multibar = new cliProgress.MultiBar(
    {
      clearOnComplete: false,
      hideCursor: true,
      format: "{bar} {percentage}% | {value}/{total} | {status}",
    },
    cliProgress.Presets.shades_grey
  );

  try {
    const page = await browser.newPage();
    page.on("console", (msg) => console.log("Page log:", msg.text()));

    console.log(colors.cyan.bold("\n🚀 Starting exercise scraper..."));

    await page.goto(`${URLPage}/exercises`, {
      waitUntil: "networkidle0",
      timeout: 30000,
    });

    await page.waitForSelector("div.flex.overflow-x-auto.gap-4 button");

    const data = [];

    // Get muscle group count for main progress bar
    const muscleGroupButtonsContainer = await page.$$(
      "div.flex.overflow-x-auto.gap-4"
    );
    const muscleGroupButtons = await muscleGroupButtonsContainer[0].$$(
      "button"
    );

    const muscleGroupButtons2 = await muscleGroupButtonsContainer[1].$$(
      "button"
    );

    console.log(
      "🚀 ~ extractExercises ~ muscleGroupButtons:",
      muscleGroupButtons
    );

    const totalMuscleGroups = muscleGroupButtons.length;

    // Create main progress bar for muscle groups
    const muscleGroupBar = multibar.create(totalMuscleGroups, 0, {
      status: "Processing muscle groups",
    });

    for (
      let muscleGroupIndex = 0;
      muscleGroupIndex < muscleGroupButtons.length;
      muscleGroupIndex++
    ) {
      const button = muscleGroupButtons[muscleGroupIndex];

      const muscleGroupName = await button.$eval("p", (el) =>
        el.textContent.trim()
      );
      const muscleGroupImg = await button
        .$eval("img", (el) => el.src)
        .catch(() => "");

      console.log(
        colors.yellow(`\n📌 Processing muscle group: ${muscleGroupName}`)
      );

      await button.click();
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const paginationLinks = await page.$$('a[aria-label^="Page"]');
      const totalPages =
        paginationLinks.length > 0
          ? await paginationLinks[paginationLinks.length - 1].$eval(
              "span",
              (el) => parseInt(el.textContent)
            )
          : 1;

      // Create progress bar for pages within current muscle group
      const pageBar = multibar.create(totalPages, 0, {
        status: `Pages for ${muscleGroupName}`,
      });

      let allExercises = [];

      for (let currentPage = 1; currentPage <= totalPages; currentPage++) {
        if (currentPage > 1) {
          const pageLink = await page.$(`a[aria-label="Page ${currentPage}"]`);
          if (pageLink) {
            await pageLink.click();
            await new Promise((resolve) => setTimeout(resolve, 2000));
          }
        }

        const exerciseLinks = await page.$$(
          "div.flex.flex-wrap.gap-x-12.gap-y-6.mt-10.justify-center.items-center a"
        );

        // Create progress bar for exercises on current page
        const exerciseBar = multibar.create(exerciseLinks.length, 0, {
          status: `Exercises on page ${currentPage}`,
        });

        for (
          let exerciseIndex = 0;
          exerciseIndex < exerciseLinks.length;
          exerciseIndex++
        ) {
          const exerciseLink = exerciseLinks[exerciseIndex];

          await exerciseLink.evaluate((node) => node.scrollIntoView());

          const exerciseInfo = await exerciseLink.$$eval(
            "div.h-28.p-4.bg-white.rounded-b-xl.flex.flex-col.justify-around.items-start p",
            (elements) => ({
              name: elements[0]?.textContent.trim() || "",
              equipment:
                elements[1]?.textContent.match(/\/\s*(.+)$/)?.[1].trim() || "",
            })
          );

          const exerciseImg = await exerciseLink
            .$eval("img", (el) => el.src)
            .catch(() => "");

          const equipmentInfo = await page.evaluate((equipmentName) => {
            const equipmentButtons = Array.from(
              document
                .querySelectorAll("div.flex.overflow-x-auto.gap-4")[1]
                .querySelectorAll("button")
            );
            const equipment = equipmentButtons.find(
              (button) =>
                button.querySelector("p")?.textContent.trim() === equipmentName
            );
            return equipment ? equipment.querySelector("img")?.src : "";
          }, exerciseInfo.equipment);

          allExercises.push({
            name: exerciseInfo.name,
            equipment: {
              name: exerciseInfo.equipment,
              img: equipmentInfo || "",
            },
            img: exerciseImg,
          });

          // Update exercise progress
          exerciseBar.update(exerciseIndex + 1, {
            status: `Processing: ${exerciseInfo.name}`,
          });
        }

        // Update page progress
        pageBar.update(currentPage, {
          status: `Completed page ${currentPage}/${totalPages}`,
        });

        // Remove exercise bar after page completion
        multibar.remove(exerciseBar);
      }

      data.push({
        muscleGroups: muscleGroupName,
        img: muscleGroupImg,
        exercises: allExercises,
        totalExercises: allExercises.length,
      });

      await button.click();
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Update muscle group progress
      muscleGroupBar.update(muscleGroupIndex + 1, {
        status: `Completed: ${muscleGroupName}`,
      });

      // Remove page bar after muscle group completion
      multibar.remove(pageBar);
    }

    // Stop progress bars
    multibar.stop();

    return data;
  } catch (error) {
    console.error(colors.red.bold("\n❌ Scraping failed:"), error);
    throw error;
  } finally {
    await new Promise((resolve) => setTimeout(resolve, 20000));
    await browser.close();
  }
}

// Execute the scraper
(async () => {
  try {
    console.log(colors.cyan.bold("\n🔍 Starting exercise extraction...\n"));
    const exercises = await extractExercises();

    console.log(colors.green.bold("\n✅ Scraping completed successfully!"));
    console.log(colors.yellow("\n📝 Writing data to file..."));

    fs.writeFileSync("exercises.json", JSON.stringify(exercises, null, 2));
    console.log(colors.green("\n✨ Data saved to exercises.json\n"));
  } catch (error) {
    console.error(colors.red.bold("\n❌ Failed to extract exercises:"), error);
  }
})();

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

    const data = [
      {
        muscleGroups: "Abs",
        exercises: [
          {
            name: "plank",
            type: "Body Weight",
            img: "",
          },
        ],
      },
    ];

    muscleGroups.forEach(async (button, index) => {
      const text = button.querySelector("p")?.textContent.trim();
      console.log(`Button ${index}: ${text}`);

      if (text === "Abs") {
        button.click();

        await new Promise((resolve) => setTimeout(resolve, 2000));

        const exercises = document.querySelector(
          "div.flex.flex-wrap.gap-x-12.gap-y-6.mt-10.justify-center.items-center a"
        );

        console.log("exercises", exercises);

        // exercises.forEach((exercise) => {
        //   console.log(exercise);
        // const div = exercise.querySelector(
        //   "div.h-28.p-4.bg-white.rounded-b-xl.flex.flex-col.justify-around.items-start"
        // );
        // console.log(div);
        //   const p = div.querySelector(
        //     'p[data-slot="text"].text-xl\\/6.dark:d-main-black.tracking-tight.font-semibold.text-jefit-blue'
        //   );
        // });

        // const nameOfExercise = Array.from(exercises).map((exercise) => {
        //   const text = exercise
        //     .querySelector(
        //       'p[data-slot="text"].text-xl\\/6.dark:d-main-black.tracking-tight.font-semibold.text-jefit-blue'
        //     )
        //     .textContent.trim();
        //   return text;
        // });

        // const specificSpan = document.querySelector(
        //   'span[data-slot="text"].text-base\\/6.text-main-black'
        // );

        // if (specificSpan) {
        //   const text = specificSpan.textContent.trim();
        //   console.log("Found specific text:", text);
        // }
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

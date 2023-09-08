require("dotenv").config();
const fs = require("fs");
const { parse } = require("csv-parse");
const inquirer = require("inquirer");
const chalk = require("chalk");

const SECONDS_DELAY = 1;
const rows = [];

askForFileName();

async function askForFileName() {
  const questions = [
    {
      type: "input",
      name: "filename",
      message: "Enter a filename:",
      validate: function (input) {
        // Validate the input to ensure it's not empty
        if (!input) {
          return "Please enter a filename.";
        }
        return true;
      },
    },
  ];

  const answers = await inquirer.prompt(questions);

  const filename = answers.filename;
  console.log(`You entered the filename: ${filename}`);

  // Now you can use the "filename" variable in your code
  fs.createReadStream(filename) //"csv_transaction_list_testh2.csv")
    .pipe(
      parse({
        delimiter: ",",
        from_line: 1,
        columns: true,
        // group_columns_by_name: true,
      })
    )
    .on("data", function (row) {
      console.log(chalk.bgGreenBright.bold(row["Payer First Name"]));

      rows.push(row);

      addInvoice({ row });
    })
    .on("end", async function () {
      console.log(
        chalk.bold(`\nFound ${rows.length} records ready to process\n`)
      );

      const response = await inquirer.prompt([
        {
          type: "confirm",
          name: "confirm",
          message: "Do you want to continue?",
          default: true, // Optional, sets the default to Yes
        },
      ]);

      // Handle the user's response
      if (response.confirm) {
        console.log("");

        const promises = rows.map(async (row, index) => {
          await new Promise((resolve) =>
            setTimeout(resolve, SECONDS_DELAY * 1000 * index)
          );

          try {
            const data = await addInvoice({
              row,
              dryRun: false,
            });

            return data;
          } catch (error) {
            console.error("Error:", error);
            return null; // or handle the error as needed
          }
        });

        Promise.all(promises)
          .then((results) => {
            // All promises have resolved, and results contains the resolved values
            console.log("\nFinished creating invoices!");
            console.table(results, ["name", "status", "invoiceNumber"]);
          })
          .catch((error) => {
            console.error("Error:", error);
          });
      } else {
        console.log("Cancelled, no invoices created.");
      }
    })
    .on("error", function (error) {
      console.log(error.message);
    });
}

async function addInvoice({ row, dryRun = true }) {
  const [patientId, passId] = row["Client Contract Ref"].split(":");

  const data = {
    api_key: process.env.NOOKAL_API_KEY,
    location_id: 1,
    practitioner_id: 1,
    patient_id: patientId,
    "items[0][item_id]": passId,
    "items[0][type]": "Pass",
    "payments[0][method]": "Credit Card",
    "payments[0][amount]": row["Payment Amount"],
  };

  if (dryRun) {
    console.table(data);
    return data;
  } else {
    const url = "https://api.nookal.com/production/v2/addInvoice";
    const paramsString = encodeParams(data);

    try {
      console.log(`Creating invoice for ${row["Payer First Name"]}...`);

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: paramsString,
      });

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const responseData = await response.json();

      const responseSummary = {
        name: row["Payer First Name"],
        status: responseData.status,
        invoiceNumber: responseData.data.results.invoice.invoiceNumber,
      };

      return responseSummary;
    } catch (error) {
      console.error("Error:", error);
      throw error;
    }
  }
}

function encodeParams(data) {
  const params = new URLSearchParams();

  for (const key in data) {
    params.append(key, data[key]);
  }
  return params.toString();
}

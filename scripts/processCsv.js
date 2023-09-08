require("dotenv").config();
const fs = require("fs");
const { parse } = require("csv-parse");
const inquirer = require("inquirer");
const chalk = require("chalk");

const SECONDS_DELAY = 1;
const rows = [];

// Run the program
main();

async function main() {
  // Ask for filename
  const filename = await askForFileName();

  if (!filename) {
    console.log("No filename provided. Exiting.");
    return;
  }

  const fileStream = createFileStream(filename);

  // Read CSV data and perform dry run
  const parsedData = await parseCsvFile(fileStream);
  if (parsedData.length === 0) {
    console.log("No data to process. Exiting.");
    return;
  }

  // Confirm continue and process invoices
  const shouldContinue = await confirmContinuation();
  if (!shouldContinue) {
    console.log("Cancelled, no invoices created.");
    return;
  }

  await processInvoices(parsedData);
}

async function parseCsvFile(fileStream) {
  const parsedData = [];

  return new Promise((resolve, reject) => {
    fileStream
      .pipe(
        parse({
          delimiter: ",",
          from_line: 1,
          columns: true,
        })
      )
      .on("data", function (row) {
        console.log(chalk.bgGreenBright.bold(row["Payer First Name"]));
        rows.push(row);
        addInvoice({ row, dryRun: true });
        parsedData.push(row);
      })
      .on("end", function () {
        console.log(
          chalk.bold(`\nFound ${rows.length} records ready to process\n`)
        );
        resolve(parsedData);
      })
      .on("error", function (error) {
        console.error(error.message);
        reject(error);
      });
  });
}

async function processInvoices(data) {
  const promises = data.map(async (row, index) => {
    await sleep(SECONDS_DELAY * 1000 * index);

    try {
      const invoiceData = await addInvoice({
        row,
        dryRun: false,
      });

      return invoiceData;
    } catch (error) {
      console.error("Error:", error);
      return null;
    }
  });

  try {
    const results = await Promise.all(promises);
    console.log("\nFinished creating invoices!");
    console.table(results);
  } catch (error) {
    console.error("Error:", error);
  }
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

async function askForFileName() {
  const answers = await inquirer.prompt([
    {
      type: "input",
      name: "filename",
      message: "Enter a filename:",
      validate: function (input) {
        if (!input) {
          return "Please enter a filename.";
        }
        return true;
      },
    },
  ]);

  const filename = answers.filename;
  //  console.log(`You entered the filename: ${filename}`);
  return filename;
}

function createFileStream(filename) {
  const fileStream = fs.createReadStream(filename);

  fileStream.on("error", (err) => {
    if (err.code === "ENOENT") {
      console.error("File not found:", filename);
    } else {
      console.error("Error:", err.message);
    }
  });

  return fileStream;
}

async function confirmContinuation() {
  const response = await inquirer.prompt([
    {
      type: "confirm",
      name: "confirm",
      message: "Do you want to continue?",
      default: true,
    },
  ]);

  return response.confirm;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function encodeParams(data) {
  const params = new URLSearchParams();

  for (const key in data) {
    params.append(key, data[key]);
  }
  return params.toString();
}

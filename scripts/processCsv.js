const fs = require("fs");
const { parse } = require("csv-parse");
const API_KEY = "";

fs.createReadStream("csv_transaction_list_test.csv")
  .pipe(parse({ delimiter: ",", from_line: 2 }))
  .on("data", function (row) {
    console.log(row);
  })
  .on("end", function () {
    addInvoice();

    console.log("finished");
  })
  .on("error", function (error) {
    console.log(error.message);
  });

function addInvoice() {
  const data = {
    api_key: API_KEY,
    location_id: 1,
    practitioner_id: 1,
    patient_id: 2,
    "items[0][item_id]": 1,
    "items[0][type]": "Pass",
    "payments[0][method]": "Credit Card",
    "payments[0][amount]": 210.0,
  };

  const url = "https://api.nookal.com/production/v2/addInvoice";
  const paramsString = encodeParams(data);

  console.log(paramsString);

  fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: paramsString,
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.json();
    })
    .then((data) => {
      console.log("Response:", JSON.stringify(data, null, 2));
    })
    .catch((error) => {
      console.error("Error:", error);
    });
}

function encodeParams(data) {
  const params = new URLSearchParams();

  for (const key in data) {
    params.append(key, data[key]);
  }
  return params.toString();
}

# Introduction

The project allows you to batch process EziDebit receipts and create Invoices in Nookal.

# Project Installation Guide

This guide will walk you through the process of installing and setting up the script on your Mac computer. Please follow these steps carefully.

## Prerequisites

Before you begin, ensure you have the following prerequisites installed on your Mac:

1. **Node.js and npm**: You can download and install Node.js and npm from [nodejs.org](https://nodejs.org/). After installing, verify the installation by running the following commands in your terminal:

   ```shell
   node -v
   npm -v
   ```

   Ensure that both commands return version numbers to confirm successful installation.

2. **Git**: Verify you have git already installed by running:

   ```shell
   git --version
   ```

   Make sure it returns a version number. If not, you can download and install Git from [git-scm.com](https://git-scm.com/). 

## Installation

Now that you have the prerequisites installed, let's set up the Node.js project:

1. **Clone the Repository**: Open your terminal and navigate to the directory where you want to install the project. 

   ```shell
   cd path/to/folder
   ```

   Then, clone the project's repository using Git:

   ```shell
   git clone https://github.com/ryanp32/fortify-fitness.git
   ```

2. **Navigate to Project Directory**: Change your working directory to the newly cloned project:

   ```shell
   cd fortify-fitness
   ```

3. **Install Dependencies**: Use npm to install project dependencies defined in the `package.json` file:

   ```shell
   npm install
   ```

   This command will download and install all required packages.

## Configuration

### API Key

Add your API key into the `.env` file to allow the script to communicate to Nookal.

### CSV File

Name your CSV file `csv_transaction_list.csv` and add it to the `fortify-fitness` directory.

## Running the Project

After completing the installation and configuration, you can run the script:

```shell
node scripts/processCsv.js
```

This command will read the CSV, then loop over each row and create invoices in Nookal.

## Conclusion

You've successfully installed and set up the EziDebit to Nookal script on your Mac computer. If you encounter any issues or have questions, refer to the project's documentation or seek assistance from the project's maintainers.

Happy processing!

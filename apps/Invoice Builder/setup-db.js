const mysql = require('mysql2/promise');
require('dotenv').config();

async function setup() {
  const connectionConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
  };

  const dbName = process.env.DB_NAME || 'invoice_builder';

  console.log(`Connecting to MySQL at ${connectionConfig.host}:${connectionConfig.port} as ${connectionConfig.user}...`);
  
  let connection;
  try {
    connection = await mysql.createConnection(connectionConfig);
  } catch (err) {
    console.error('Failed to connect to MySQL server. Please make sure MySQL is running and credentials in .env are correct.');
    console.error(err);
    process.exit(1);
  }

  try {
    console.log(`Creating database "${dbName}" if it does not exist...`);
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
    await connection.query(`USE \`${dbName}\``);

    console.log('Creating table "invoices" if it does not exist...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS invoices (
        UniqueID VARCHAR(255) PRIMARY KEY,
        InvoiceNumber VARCHAR(255) NOT NULL,
        InvoiceType VARCHAR(50),
        Date VARCHAR(100),
        DueDate VARCHAR(100),
        ClientName VARCHAR(255),
        ClientAddress TEXT,
        ClientPhone VARCHAR(255),
        ClientGSTIN VARCHAR(255),
        ClientState VARCHAR(255),
        ClientStateCode VARCHAR(255),
        PlaceOfSupply VARCHAR(255),
        Subtotal DECIMAL(12, 2) DEFAULT 0.00,
        TaxableAmount DECIMAL(12, 2) DEFAULT 0.00,
        Tax DECIMAL(12, 2) DEFAULT 0.00,
        CGST DECIMAL(12, 2) DEFAULT 0.00,
        SGST DECIMAL(12, 2) DEFAULT 0.00,
        IGST DECIMAL(12, 2) DEFAULT 0.00,
        TotalTax DECIMAL(12, 2) DEFAULT 0.00,
        GrandTotal DECIMAL(12, 2) DEFAULT 0.00,
        DueAmount DECIMAL(12, 2) DEFAULT 0.00,
        NonGstTaxType VARCHAR(255),
        CompanyName VARCHAR(255),
        FromAddress TEXT,
        FromPhone VARCHAR(255),
        FromEmail VARCHAR(255),
        FromGSTIN VARCHAR(255),
        Signatory VARCHAR(255),
        BankName VARCHAR(255),
        BankAcc VARCHAR(255),
        BankIFSC VARCHAR(255),
        UPI VARCHAR(255),
        Intro TEXT,
        Terms TEXT,
        ItemsJSON LONGTEXT,
        LastUpdated VARCHAR(255) NOT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    console.log('Database and tables initialized successfully!');
  } catch (err) {
    console.error('Error occurred during database initialization:');
    console.error(err);
  } finally {
    await connection.end();
  }
}

setup();

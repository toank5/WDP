import nodemailer from 'nodemailer';
import path from 'path';
import dns from 'dns';
import fs from 'fs';
import { config } from 'dotenv';

// Ensure env vars are loaded before creating transporter
config();

// Some hosting environments do not have outbound IPv6 routing.
// Prefer IPv4 for DNS lookups unless explicitly disabled.
if (process.env.SMTP_PREFER_IPV4 !== 'false') {
  dns.setDefaultResultOrder('ipv4first');
}

// Resolve mail template directory across ts-node/dev and bundled dist runtime.
const templatePathCandidates = [
  path.join(process.cwd(), 'dist', 'mail', 'templates'),
  path.join(process.cwd(), 'dist', 'templates'),
  path.join(__dirname, 'templates'),
  path.join(process.cwd(), 'src', 'mail', 'templates'),
];

const templatesPath =
  templatePathCandidates.find((candidate) => fs.existsSync(candidate)) ||
  templatePathCandidates[templatePathCandidates.length - 1];

if (!fs.existsSync(templatesPath)) {
  console.warn(
    'Mail templates directory was not found. Checked:',
    templatePathCandidates,
  );
}

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER || process.env.MAIL_USER,
    pass: process.env.SMTP_PASS || process.env.MAIL_PASS,
  },
});

// Configure Handlebars template engine
const hbsOptions = {
  viewEngine: {
    extname: '.hbs',
    partialsDir: path.join(templatesPath, 'partials'),
    layoutsDir: path.join(templatesPath, 'layouts'),
    defaultLayout: 'main',
  },
  viewPath: templatesPath,
  extName: '.hbs',
};

// Use dynamic import for ESM-only nodemailer-express-handlebars
async function configureHandlebars() {
  // Prevent webpack from rewriting import() to require() for this ESM-only package.
  const dynamicImport = new Function(
    'modulePath',
    'return import(modulePath)',
  ) as (modulePath: string) => Promise<{
    default: (options: typeof hbsOptions) => unknown;
  }>;

  const hbs = await dynamicImport('nodemailer-express-handlebars');
  transporter.use(
    'compile',
    hbs.default(hbsOptions) as Parameters<typeof transporter.use>[1],
  );
}

configureHandlebars().catch((err) =>
  console.error('Failed to configure Handlebars:', err),
);

// Verify connection on startup
transporter.verify((error) => {
  if (error) {
    console.error('Email server connection failed:', error);
  } else {
    console.log('Email server is ready to send messages');
  }
});

export default transporter;
export { hbsOptions };

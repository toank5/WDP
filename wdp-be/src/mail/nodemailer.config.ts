import nodemailer from 'nodemailer';
import path from 'path';
import dns from 'dns';
import { config } from 'dotenv';

// Ensure env vars are loaded before creating transporter
config();

// Some hosting environments do not have outbound IPv6 routing.
// Prefer IPv4 for DNS lookups unless explicitly disabled.
if (process.env.SMTP_PREFER_IPV4 !== 'false') {
  dns.setDefaultResultOrder('ipv4first');
}

// Get the current directory relative to dist folder
// When built, templates will be in dist/mail/templates
const templatesPath =
  process.env.NODE_ENV === 'production'
    ? path.join(process.cwd(), 'dist', 'mail', 'templates')
    : path.join(__dirname, 'templates');

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

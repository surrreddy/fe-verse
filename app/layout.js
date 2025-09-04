// app/layout.js
import './globals.css';

const appname = process.env.APP_DISPLAY_NAME.replace(/_/g, ' ') || 'Application';

export const metadata = {
  title: appname,
  description: 'Versatile Online Application',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      {/* Keep global styling ONLY here to avoid hydration mismatches */}
      <body className="min-h-screen bg-white text-gray-900 antialiased">
        {children}
      </body>
    </html>
  );
}

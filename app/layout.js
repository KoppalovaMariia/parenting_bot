export const metadata = { title: "Parenting Bot" };
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: "#f0f0f0" }}>{children}</body>
    </html>
  );
}

import "@/css/satoshi.css";
import "@/css/style.css";
import QueryProvider from "@/context/QueryProvider";

export const metadata = {
  title: "Hp-Biz",
  description: "Super Admin Dashboard",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning={true}>
        <QueryProvider>
          <div className="dark:bg-boxdark-2 dark:text-bodydark">
            {children}
          </div>
        </QueryProvider>
      </body>
    </html>
  );
}
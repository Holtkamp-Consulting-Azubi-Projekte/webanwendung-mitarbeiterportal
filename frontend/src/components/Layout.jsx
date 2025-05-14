import Header from "./Header";
import Footer from "./Footer";

export default function Layout({ children }) {
  return (
    <div className="flex flex-col min-h-screen bg-white text-gray-900">
      <Header />
      <main className="flex-grow max-w-7xl mx-auto w-full p-4 pt-28">{children}</main>
      <Footer />
    </div>
  );
}

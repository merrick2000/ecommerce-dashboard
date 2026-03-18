import Link from "next/link";
import { Store, Package, LayoutDashboard, Settings } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col md:flex-row bg-gray-50">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white border-r border-gray-200">
        <div className="h-full px-3 py-4 overflow-y-auto">
          <div className="mb-6 px-3">
            <h2 className="text-xl font-bold">MyDashboard</h2>
          </div>
          <ul className="space-y-2 font-medium">
            <li>
              <Link href="/dashboard" className="flex items-center p-2 text-gray-900 rounded-lg hover:bg-gray-100 group">
                <LayoutDashboard className="w-5 h-5 text-gray-500 transition duration-75 group-hover:text-gray-900" />
                <span className="ms-3">Overview</span>
              </Link>
            </li>
            <li>
              <Link href="/dashboard/products" className="flex items-center p-2 text-gray-900 rounded-lg hover:bg-gray-100 group">
                <Package className="w-5 h-5 text-gray-500 transition duration-75 group-hover:text-gray-900" />
                <span className="ms-3">Products</span>
              </Link>
            </li>
            <li>
              <Link href="/dashboard/stores" className="flex items-center p-2 text-gray-900 rounded-lg hover:bg-gray-100 group">
                <Store className="w-5 h-5 text-gray-500 transition duration-75 group-hover:text-gray-900" />
                <span className="ms-3">Stores</span>
              </Link>
            </li>
            <li>
              <Link href="#" className="flex items-center p-2 text-gray-900 rounded-lg hover:bg-gray-100 group">
                <Settings className="w-5 h-5 text-gray-500 transition duration-75 group-hover:text-gray-900" />
                <span className="ms-3">Settings</span>
              </Link>
            </li>
          </ul>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-6 md:p-10">
        {children}
      </main>
    </div>
  );
}

export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-b from-blue-50 to-white px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">PetControl</h1>
          <p className="text-gray-600 mt-1">ONG SalvaCão</p>
        </div>
        <div className="bg-white rounded-xl border shadow-sm p-6">{children}</div>
      </div>
    </div>
  );
}

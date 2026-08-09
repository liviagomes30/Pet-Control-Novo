import { Suspense } from "react";
import { LoginForm } from "./_components/LoginForm";

export const metadata = {
  title: "Entrar | PetControl",
};

export default function LoginPage() {
  return (
    <>
      <h2 className="text-lg font-semibold mb-4 text-center">Entrar</h2>
      <Suspense>
        <LoginForm />
      </Suspense>
    </>
  );
}

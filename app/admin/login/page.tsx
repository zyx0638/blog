import LoginForm from "@/components/admin/login-form";

export const metadata = {
  title: "管理登录",
};

export default function AdminLoginPage() {
  return (
    <div className="mx-auto max-w-sm px-6 py-20">
      <h1 className="mb-2 text-3xl font-bold">管理登录</h1>
      <p className="font-crt mb-8 text-sm text-gray-500">
        ACCESS CONTROL // AUTHORIZED PERSONNEL ONLY
      </p>

      <div className="glass rounded-2xl p-6 sm:p-8">
        <LoginForm />
      </div>
    </div>
  );
}

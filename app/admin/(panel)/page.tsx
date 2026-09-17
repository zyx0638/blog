import { redirect } from "next/navigation";

export default function AdminIndexPage() {
  redirect("/admin/posts");// 到这里就结束，直接跳转
}

import ReactMarkdown from "react-markdown";
import { getAbout } from "@/lib/about";

export const metadata = {
  title: "关于",
};

export default function AboutPage() {
  const about = getAbout();

  return (
    <div className="mx-auto max-w-2xl px-6">
      <h1 className="mb-8 text-2xl font-bold">关于</h1>
      <div className="prose dark:prose-invert max-w-none">
        <ReactMarkdown>{about.content}</ReactMarkdown>
      </div>
    </div>
  );
}

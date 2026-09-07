import ReactMarkdown from "react-markdown";
import { getAbout } from "@/lib/about";

export const metadata = {
  title: "关于",
};

export default function AboutPage() {
  const about = getAbout();

  return (
    <div className="mx-auto max-w-2xl px-6">
      <h1 className="mb-8 text-3xl font-bold">
        关于
        <span className="mt-2 block h-1 w-12 rounded-full bg-white" />
      </h1>

      <div className="glass rounded-2xl p-6 sm:p-8">
        <div className="prose max-w-none prose-invert prose-a:text-gray-200">
          <ReactMarkdown>{about.content}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
}

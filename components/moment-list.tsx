import ReactMarkdown from "react-markdown";
import { getAllMoments } from "@/lib/moments";

export default function MomentList() {
  const moments = getAllMoments();

  return (
    <ol className="flex flex-col gap-6">
      {moments.map((moment) => (
        <li key={moment.slug}>
          <p className="text-sm text-gray-500">{moment.date}</p>
          <div className="mt-1 text-gray-700 dark:text-gray-300">
            <ReactMarkdown>{moment.content}</ReactMarkdown>
          </div>
        </li>
      ))}
    </ol>
  );
}

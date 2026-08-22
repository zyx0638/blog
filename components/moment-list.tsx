import ReactMarkdown from "react-markdown";
import { getAllMoments } from "@/lib/moments";

export default function MomentList() {
  const moments = getAllMoments();

  return (
    <ol className="flex flex-col gap-4">
      {moments.map((moment) => (
        <li key={moment.slug} className="glass rounded-2xl p-5">
          <p className="font-crt text-sm font-medium text-orange-400">
            {moment.date}
          </p>
          <div className="mt-2 text-gray-300">
            <ReactMarkdown>{moment.content}</ReactMarkdown>
          </div>
        </li>
      ))}
    </ol>
  );
}

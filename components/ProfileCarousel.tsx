type Profile = {
  id: string;
  name: string;
  description: string;
};

const profileColors: Record<string, string> = {
  akasza: "bg-red-300",
  éana: "bg-orange-300",
  luma: "bg-yellow-300",
  sylva: "bg-green-400",
  kairos: "bg-sky-400",
  zentó: "bg-indigo-500",
  noe: "bg-violet-400",
};

type Props = {
  profiles: Profile[];
  onSelect: (id: string) => void;
};

export default function ProfileCarousel({ profiles, onSelect }: Props) {
  return (
    <div className="max-w-6xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6 text-center">Válassz egy AI-profilt</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {profiles.map((profile) => {
          const key = profile.id.toLowerCase();
          const bgColor = profileColors[key] || "bg-gray-200";

          return (
            <button
              key={key}
              onClick={() => onSelect(key)}
              className={`p-4 rounded-xl shadow-md transition-all text-center ${bgColor} hover:scale-105`}
            >
              <h3 className="font-semibold text-lg mb-1">{profile.name}</h3>
              <p className="text-sm">{profile.description}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// pages/profile-select.tsx
import { useEffect, useState } from "react";
import { supabase } from "../utils/supabaseClient";
import ProfileCarousel from "../components/ProfileCarousel";

type SupabaseProfile = {
  name: string;
  archetype: string;
  color: string;
};

export default function ProfileSelectPage() {
  const [profiles, setProfiles] = useState([]);
  const [selectedProfile, setSelectedProfile] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfiles = async () => {
      const { data, error } = await supabase.from("profiles").select("name, archetype, color");
      if (!error && data) {
        const formatted = data.map((p: SupabaseProfile) => ({
          id: p.name.toLowerCase(),
          name: p.name,
          description: p.archetype,
          color: `bg-[${p.color}]`, // Tailwind szín workaround
        }));
        setProfiles(formatted);
      }
    };
    fetchProfiles();
  }, []);

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center">
      {!selectedProfile && profiles.length > 0 ? (
        <ProfileCarousel profiles={profiles} onSelect={(id) => setSelectedProfile(id)} />
      ) : (
        <div className="text-center">
          <h1 className="text-xl font-bold mb-4">Kiválasztott profil:</h1>
          <p className="text-lg">{selectedProfile}</p>
        </div>
      )}
    </div>
  );
}

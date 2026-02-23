import { supabase } from "@/lib/supabase";

export default async function NotesPage() {
  const { data: notes } = await supabase
    .from("notes")
    .select("id, text")
    .order("created_at", { ascending: false });

  return (
    <main style={{ padding: 24 }}>
      <h1>Notes</h1>
      <ul>
        {notes?.map((note) => (
          <li key={note.id}>{note.text}</li>
        ))}
      </ul>
    </main>
  );
}
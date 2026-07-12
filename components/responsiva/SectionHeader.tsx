export default function SectionHeader({ title }: { title: string }) {
  return (
    <div className="bg-[#0D3B6E] px-2 py-1 text-center text-xs font-bold text-white">
      {title}
    </div>
  );
}

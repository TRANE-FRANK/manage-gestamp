interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export default function Card({
  children,
}: CardProps) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm">
      {children}
    </div>
  );
}
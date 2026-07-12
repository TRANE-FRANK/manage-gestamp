interface Props {
  label: string;
  value?: string | null;
}

export default function TableCell({ label, value }: Props) {
  return (
    <td className="border p-1 text-xs">
      <div className="font-semibold">{label}</div>

      <div className="min-h-[20px]">{value ?? ""}</div>
    </td>
  );
}

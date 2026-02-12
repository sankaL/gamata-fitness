interface SectionHeaderProps {
  title: string
}

export function SectionHeader({ title }: SectionHeaderProps) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-5 w-1 rounded-full bg-primary" />
      <h2 className="text-base font-bold italic text-foreground">{title}</h2>
    </div>
  )
}

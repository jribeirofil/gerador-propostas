// Fullscreen overlay — escapes the dashboard sidebar layout visually
export default function PreviewWebLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-white">
      {children}
    </div>
  )
}

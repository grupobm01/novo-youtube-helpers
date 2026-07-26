export default function Blocked() {
  // Always English so blocked users see the message regardless of stored language.
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-background text-foreground">
      <div className="w-full max-w-[430px] text-center space-y-4">
        <h1 className="text-2xl font-bold">Site Down</h1>
      </div>
    </div>
  );
}

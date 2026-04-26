"use client";

export default function LoginForm({
  password,
  onPasswordChange,
  onSubmit,
}: {
  password: string;
  onPasswordChange: (v: string) => void;
  onSubmit: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-light-background dark:bg-dark-background">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
        className="flex flex-col gap-4 p-8 bg-white dark:bg-neutral-900 rounded-lg shadow-lg w-80"
      >
        <h1 className="text-xl font-semibold text-center">Photography Admin</h1>
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => onPasswordChange(e.target.value)}
          className="px-4 py-2 border border-neutral-300 dark:border-neutral-700 rounded bg-transparent"
          autoFocus
        />
        <button
          type="submit"
          className="px-4 py-2 bg-neutral-900 dark:bg-white text-white dark:text-black rounded font-medium hover:opacity-90 transition-opacity"
        >
          Login
        </button>
      </form>
    </div>
  );
}

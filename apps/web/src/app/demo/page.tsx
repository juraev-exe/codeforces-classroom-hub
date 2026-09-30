import Demo from '@/components/ui/demo';

export const metadata = {
  title: 'Dropdown Navigation Demo | Codeforces Classroom Hub',
};

export default function DemoPage() {
  return (
    <div className="w-full min-h-[80vh] flex flex-col items-center justify-start py-10">
      <div className="text-center mb-8 space-y-2">
        <h1 className="text-2xl font-bold text-white tracking-tight">Dropdown Navigation Component Demo</h1>
        <p className="text-xs text-zinc-400">Interactive tabs & animated dropdown menus with Framer Motion and Lucide icons</p>
      </div>
      <Demo />
    </div>
  );
}

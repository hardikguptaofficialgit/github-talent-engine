import Navbar from "@/components/Layout/Navbar";

const ForCompanies = () => {
  return (
    <div className="app-bg min-h-screen text-white pb-10">
      <Navbar />
      <main className="px-4 md:px-8 pt-8">
        <div className="mx-auto max-w-[1020px] app-panel rounded-2xl p-8 md:p-10">
          <h1 className="text-4xl md:text-5xl font-bold">For Companies</h1>
          <p className="mt-4 text-white/70 text-lg">
            Hire high-signal developers using verified open-source contribution data.
          </p>

          <div className="mt-8 rounded-xl border border-white/15   p-6">
            <h2 className="text-2xl font-semibold">Contact</h2>
            <p className="mt-3 text-white/70">
              To start hiring with OpenSourceHire, contact:
            </p>
            <a
              href="mailto:hardikgupta8792@gmail.com"
              className="mt-4 inline-flex h-11 items-center rounded-full bg-[#ff7a00] px-6 text-black font-semibold"
            >
              hardikgupta8792@gmail.com
            </a>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ForCompanies;

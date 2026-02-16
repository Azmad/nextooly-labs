import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-4">
            Nextooly Labs
          </h1>
          <p className="text-lg text-gray-600">
            Experimental, open-source, and client-side tools powered by WebAssembly.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Tool Card 1: Image Background Remover */}
          <Link 
            href="/image-background-remover"
            className="block p-6 bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-blue-300 transition-all group"
          >
            <div className="h-12 w-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Background Remover</h2>
            <p className="text-gray-500 text-sm">
              Remove image backgrounds instantly using client-side AI. 100% private.
            </p>
          </Link>

          {/* Placeholder for future tools */}
          {/* <div className="p-6 bg-gray-50 rounded-xl border border-gray-200 border-dashed flex flex-col items-center justify-center text-gray-400">
            <span className="text-sm font-medium">More tools coming soon...</span>
          </div> */}
        </div>

        <div className="mt-16 text-center border-t border-gray-200 pt-8">
          <p className="text-sm text-gray-500">
            These tools are open-source under the AGPLv3 license. 
            <a href="https://github.com/YOUR_USERNAME/nextooly-labs" target="_blank" className="text-blue-600 hover:underline ml-1">
              View Source on GitHub
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}